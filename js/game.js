(function() {
    //
    // Components
    //

    // a renderable entity
    Crafty.c('Renderable', {
        init: function() {
            // we're using DOM Spirtes
            this.requires('2D, DOM');
        },
        // set which sprite to use -- should match up with a call to Crafty.sprite()
        spriteName: function(name) {
            this.requires(name);
            return this; // so we can chain calls to setup functions
        }
    });

    // a component to fade out an entity over time
    Crafty.c('FadeOut', {
        init: function() {
            this.requires('2D');

            // the EnterFrame event is very useful for per-frame updates!
            this.bind("EnterFrame", function() {
                this.alpha = Math.max(this._alpha - this._fadeSpeed, 0.0);
                if (this.alpha < 0.05) {
                    this.trigger('Faded');
                    // its practically invisible at this point, remove the object
                    this.destroy();
                }
            });
        },
        // set the speed of fading out - should be a small number e.g. 0.01
        fadeOut: function(speed) {
            // reminder: be careful to avoid name clashes...
            this._fadeSpeed = speed;
            return this; // so we can chain calls to setup functions
        }
    });

    // rotate an entity continually
    Crafty.c('Rotate', {
        init: function() {
            this.requires('2D');

            // update rotation each frame
            this.bind("EnterFrame", function() {
                this.rotation = this._rotation + this._rotationSpeed;
            });
        },
        // set speed of rotation in degrees per frame
        rotate: function(speed) {
            // rotate about the center of the entity
            this.origin('center');
            this._rotationSpeed = speed;
            return this; // so we can chain calls to setup functions
        }
    });

    // an exciting explosion!
    Crafty.c('Explosion', {
        init: function() {
            // reuse some helpful components
            this.requires('Renderable, FadeOut')
                .spriteName('explosion' + Crafty.math.randomInt(1,2))
                .fadeOut(0.07);
        }
    });

    // a bullet, it shoots things
    Crafty.c('Bullet', {
        init: function() {
            this.requires('Renderable, Collision, Delay, SpriteAnimation')
                .spriteName('bullet')
                .collision()
                // set up animation from column 0, row 1 to column 1
                .animate('fly', 0, 1, 1)
                // start the animation
                .animate('fly', 2, -1)
                // move left every frame, destroy bullet if its off the screen
                .bind("EnterFrame", function() {
                    this.x += 10;
                    if (this.x > 1024) {
                        this.destroy();
                    }
                });
        }
    });

    Crafty.c('EnemyBullet', {
        init: function() {
            this.requires('Renderable, Collision, Delay, SpriteAnimation')
                .spriteName('bullet')
                .collision()
                // set up animation from column 0, row 1 to column 1
                .animate('fly', 0, 1, 1)
                // start the animation
                .animate('fly', -5, -1)
                // move left every frame, destroy bullet if its off the screen
                .bind("EnterFrame", function() {
                    this.x -= 10;
                    if (this.x > 1024 || this.x < 0) {
                        this.destroy();
                    }
                })
        }
    });

    Crafty.c('BackBullet', {
        init: function() {
            this.requires('Renderable, Collision, Delay, SpriteAnimation')
                .spriteName('bullet')
                .collision()
                // set up animation from column 0, row 1 to column 1
                .animate('fly', 0, 1, 1)
                // start the animation
                .animate('fly', 5, -1)
                // move left every frame, destroy bullet if its off the screen
                .bind("EnterFrame", function() {
                    this.x += 10;
                    if (this.x > 1024 || this.x < 0) {
                        this.destroy();
                    }
                })
        }
    });


    // targets to shoot at
    Crafty.c('Target', {
        init: function() {
            this.requires('2D, Renderable, Collision, Delay, Tween, Actor')
                // choose a random enemy sprite to use
                .spriteName('enemy' + Crafty.math.randomInt(1,2))
                .collision()
                // detect when we get hit by bullets
                .onHit('Bullet', this._hitByBullet);
            // choose a random position
            this._randomlyPosition();
            this.moveTarget();

            var min = 2000,
            max = 3000;
            this.delay(this.randomlyFire, Crafty.math.randomInt(min, max));

        },
        // randomly position
        _randomlyPosition: function() {
            this.attr({
                x: 900, //Crafty.math.randomNumber(1000, 1200),
                y: Crafty.math.randomNumber(0,600)});
        },
        // we got hit!
        _hitByBullet: function() {
            // find the global 'Score' component
            var score = Crafty('Score'),
                scoreModifier;
            score.increment();

            // scoreModifier =

            // show an explosion!
            Crafty.e("Explosion").attr({x:this.x, y:this.y});

            // hide this offscreen
            this.x = -2000;

            // reappear after a second in a new position
            this.delay(this._randomlyPosition, 1000/score.score);
        },

        moveTarget: function() {

                var xMovement = Crafty.math.randomInt(-100, 100);
                var yMovement = Crafty.math.randomInt(-100, 100);

                var newPos = {
                   // x: this.x -50, //this.x + (Crafty("Player")._x - this.x)/5,
                    x: this.x + (Crafty("Player")._x - this.x)/10,
                    y: this.y + (Crafty("Player")._y - this.y)/5,
                    w: this.w,
                    h: this.h
                };

                if(this.within.call(newPos, 0, 0, Crafty.viewport.width, Crafty.viewport.height)) {
                    this.tween({x: newPos.x, y: newPos.y}, 60);
                }

            this.delay(this.moveTarget, 300);
        },

        randomlyFire: function() {

            var score = Crafty('Score').score,
                min,max, baseline = 10000;

                if( score == 0 ) {
                    max = baseline;
                    min = 1000 - max;
                } else {
                    max = Math.floor((10/score)*10000000);
                    min = Math.floor((10/score)*10000000);
                }

            this.delay(this.randomlyFire, Crafty.math.randomInt(min, max));

            //shoot backwards if player is behind
            if ( this.x > Crafty("Player")._x ) {
                Crafty.e("EnemyBullet").attr({x: this.x - 5, y: this.y});
            } else {
                Crafty.e("BackBullet").attr({x: this.x - 5, y: this.y});
            }

        }
    });

    // Limit movement to within the viewport
    Crafty.c('ViewportBounded', {
        init: function() {
            this.requires('2D');
        },
        // this must be called when the element is moved event callback
        checkOutOfBounds: function(oldPosition) {
            if(!this.within(0, 0, Crafty.viewport.width, Crafty.viewport.height)) {
                this.attr({x: oldPosition.x, y: oldPosition.y});
            }
        }
    });

    // Player component
    Crafty.c('Player', {
        init: function() {
            this.requires('Renderable, Fourway, Collision, ViewportBounded, SpriteAnimation')
                .spriteName('player')
                .collision()
                .attr({x: 64, y: 64})
                // animate the ship - set up animation, then trigger it
                .animate('fly', 0, 0, 1)
                .animate('fly', 100, -1)
                // set up fourway controller
                .fourway(5)

                .collision(new Crafty.polygon(
                    [10, 40],
                    [10, 80],
                    [180, 80],
                    [180, 40]
                ))

                // also react to the SPACE key being pressed
                .requires('Keyboard')
                .bind('KeyDown', function(e) {
                    if (e.key === Crafty.keys.SPACE) {
                        // fire bullet
                        Crafty.e("Bullet").attr({x: this.x + 5, y: this.y});
                    }
                });

            this.onHit('Target', this.badGuyCollision);
            this.onHit('EnemyBullet', this.badGuyCollision);

            // bind our movement handler to keep us within the Viewport
            this.bind('Moved', function(oldPosition) {
                this.checkOutOfBounds(oldPosition);
            });
        },
        badGuyCollision: function() {
                // replace the ship with an explosion!
                Crafty.e("Explosion").attr({x:this.x, y:this.y});
                this.destroy();

                setTimeout(function(){
                        Crafty.scene('gameOver');
                },3000);



        }
    });

    // A component to display the player's score
    Crafty.c('Score', {
        init: function() {
            this.score = 0;
            this.requires('2D, DOM, Text');
            this._textGen = function() {
                return "Score: " + this.score;
            };
            this.attr({w: 100, h: 20, x: 900, y: 0})
                .text(this._textGen);
        },
        // increment the score - note how we call this.text() to change the text!
        increment: function() {
            this.score = this.score + 1000;
            this.text(this._textGen);
        }
    });


    //
    // Game loading and initialisation
    //
    var Game = function() {
        Crafty.scene('loading', this.loadingScene);
        Crafty.scene('start', this.startGameScreen);
        Crafty.scene('main', this.mainScene);
        Crafty.scene('gameOver', this.gameOver);
    };

    Game.prototype.initCrafty = function() {
        console.log("page ready, starting CraftyJS");
        Crafty.init(1000, 600);
        Crafty.canvas.init();

        Crafty.modules({ 'crafty-debug-bar': 'release' }, function () {
            if (Crafty.debugBar) {
               Crafty.debugBar.show();
            }
        });
    };

    // A loading scene -- pull in all the slow things here and create sprites
    Game.prototype.loadingScene = function() {
        var loading = Crafty.e('2D, Canvas, Text, Delay');
        loading.attr({x: 512, y: 200, w: 100, h: 20});
        loading.text('loading...');

        function onLoaded() {
            // set up sprites
            Crafty.sprite(64, 'img/shooter-sprites.png', {
                player: [0, 0],
                bullet: [0, 1],
                enemy1: [0, 2],
                enemy2: [1, 2],
                explosion1: [0, 3],
                explosion2: [1, 3]
                });

            // jump to the main scene in half a second
            loading.delay(function() {
                Crafty.scene('start');
                //Crafty.scene('main');
            }, 500);
        }

        function onProgress(progress) {
            loading.text('loading... ' + progress.percent + '% complete');
        }

        function onError() {
            loading.text('could not load assets');
        }

        Crafty.load([
            // list of images to load
            'img/shooter-sprites.png'
        ],
        onLoaded, onProgress, onError);

    };



    //
    // Game OVER
    //
    Game.prototype.startGameScreen = function() {
        var startScreen = Crafty.e('2D, Canvas, Text, Delay');
            startScreen.attr({x: 210, y: 200, w: 100, h: 20});
            startScreen.text('Hit ENTER to play!!!')
                .textColor('#FF69B4')
                .textFont({ size: '60px', family: 'Comic Sans MS' });

                startScreen.requires('Keyboard')
                    .bind('KeyDown', function () {
                        if (this.isDown(13)){
                              Crafty.scene('main');
                              startScreen.textFont({ size: '20px', family: 'Comic Sans MS' });
                         }
                });


    };


    //
    // The main game scene
    //
    Game.prototype.mainScene = function() {
        // create a scoreboard
        Crafty.e('Score');

        //create a player...
        Crafty.e('Player');

        // create some junk to avoid
        for (i = 0; i < 5; i++) {
            Crafty.e('Target');
        }
    };


    //
    // Game OVER
    //
    Game.prototype.gameOver = function() {
        var score = Crafty('Score').score;

     var startScreen = Crafty.e('2D, Canvas, Text, Delay');
            startScreen.attr({x: 210, y: 200, w: 100, h: 20});
            startScreen.text('GAME OVER your score : ' + score)
                .textColor('#FF69B4')
                .textFont({ size: '60px', family: 'Comic Sans MS' });

                startScreen.requires('Keyboard')
                    .bind('KeyDown', function () {
                        if (this.isDown(13)){
                              Crafty.scene('main');
                              startScreen.textFont({ size: '20px', family: 'Comic Sans MS' });
                         }
                });

    };


 // kick off the game when the web page is ready
        $(document).ready(function() {
            var game = new Game();
            game.initCrafty();

            // start loading things
            Crafty.scene('loading');
        });

})();
