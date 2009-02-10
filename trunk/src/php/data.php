<?php
// Start the session for this page
session_start();
header("Cache-control: private");
define(DIRECTORY, getcwd() . DIRECTORY_SEPARATOR . '_FILES');

// Setup some variables
$store = $_REQUEST['directory'];
if( !isset($store) ) {
	$store = "images";
}
$directory = DIRECTORY . DIRECTORY_SEPARATOR . $store;

$dir = opendir($directory);
$i = 0;

// Get a list of all the files in the directory
while ($temp = readdir($dir)) {
	if (is_dir($directory . DIRECTORY_SEPARATOR . $temp)) continue; // If its a directory skip it

	$results[$i]['name'] = $temp;
	$results[$i]['size'] = filesize($directory . '/' . $temp);
	$results[$i]['mtime'] = filemtime($directory . '/' . $temp);
	$results[$i]['url'] = "src/php/_FILES/$store/" . $temp;
	$i++;
}

if (is_array($results)) {
	$data['count'] = count($results);
	$data['data'] = $results;
} else {
	$data['count'] = 0;
	$data['data'] = '';
}

print json_encode($data);
?>