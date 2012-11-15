<?php

require('config.php');

/**
 * This file contains the api calls for database connections etc
 *
 */

$result = array();

// Check for AJAX
if ( !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest' ) {

	// Make safe!
	$player = mysql_real_escape_string($_REQUEST["player"]);
	$score = mysql_real_escape_string($_REQUEST["score"]);
	$created = date('Y-m-d H:i:s', time('now'));

	// Prep the database
	$link = mysql_connect($db['host'], $db['user'], $db['password']);
	if (!$link) {
	    die('Could not connect: ' . mysql_error());
	}
	mysql_select_db($db['database']);

	// Insert
	mysql_query("INSERT INTO scores (player, score, created) values ('$player', '$score', '$created')");
	// printf("Last inserted record has id %d\n", mysql_insert_id());
	$result['status'] = TRUE;
	$result['playerId'] = mysql_insert_id();
	$result['message'] = "Record successfully inserted";

	// TODO: return top scores

} else {
	$result['status'] = FALSE;
	$result['message'] = 'Only XML request allowed';
}

// Return the status
header('Content-type: application/json');
echo json_encode($result);
