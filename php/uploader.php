<?php

$response = array();
$query = $_POST['query'];
if(isset($query) && $query === 'passport-upload'){  // file upload attempt
	$inputName = 'passport';
	$target_path = "uploads" . DIRECTORY_SEPARATOR;
	
	$fileName = $_FILES[$inputName]['name'];
	$fileSize = $_FILES[$inputName]['size'];
	$fileType = $_FILES[$inputName]['type'];
	$fileErr = $_FILES[$inputName]['error'];
	$tmpName  = $_FILES[$inputName]['tmp_name'];
	
	$uploadErrors = array(
	    UPLOAD_ERR_OK => 'There is no error, the file uploaded with success.',
	    UPLOAD_ERR_INI_SIZE => 'The uploaded file exceeds the upload maximum filesize directive',
	    UPLOAD_ERR_FORM_SIZE => 'The uploaded file exceeds the upload maximum filesize directive',
	    UPLOAD_ERR_PARTIAL => 'The uploaded file was only partially uploaded.',
	    UPLOAD_ERR_NO_FILE => 'No file was uploaded.'
	);
	
	if( is_uploaded_file($tmpName) ){
		$target_path = $target_path . basename($fileName);
		if(move_uploaded_file($tmpName, $target_path)) {
			$response['success'] = true;
	        $response['validState'] = true;
                $response['data'] = array(); // needed if you ever use this with Ext.ux.XMetaForm or Ext.ux.Wizard !!
			$response['screenshotUrl'] = str_replace(DIRECTORY_SEPARATOR, '/', 'php' . DIRECTORY_SEPARATOR . $target_path);
		} else {
			$response['success'] = false;
			if(isset($uploadErrors[$fileErr])){
				$response['errors'] = array($uploadErrors[$fileErr]);
			}
		}	
	}else{
		$response['success'] = false;
		$response['errors'] = array('No file was uploaded.');
	}
}else{  // the form was submitted
	$response['success'] = true;
}


echo json_encode($response);

?>