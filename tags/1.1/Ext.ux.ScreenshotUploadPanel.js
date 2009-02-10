/*
 * This is a component that builds on the work of lopeky (BrowseButton)
 * It allows for upload of files to the server
 * 
 * @class Ext.ux.ScreenshotUploadPanel
 * @extends Ext.Panel
 * 
 * @author Charles Opute Odili (chalu)
 * @version 1.0 Beta
 * @license GPLv3
 */
Ext.ux.ScreenshotUploadPanel = Ext.extend(Ext.Panel, {
    /**
     * The upload URL for the screenshot
     * @type String
     */
    uploadUrl: '',
    
    /**
     * The URL to a placeholder 
     * that will be replaced with the upload
     * @type String
     */
    emptyUrl: 'placeholder.gif',
    
    /**
     * The URL to an existing screenshot
     * to initialize the view with.
     * It will be replaced with the upload and is used inplace of
     * emptyUrl if specified
     * @type String
     */
    screenshotUrl: '',
    
    /**
     * The name the file upload is submited with
     * @type String
     */
    inputFileName: 'screenshot',        
    
    /**
     * The width of the panel
     * @type Number
     */
    width: 100,
    
    /**
     * The height of the panel
     * @type Number
     */
    height: 110,    
    
    /**
     * A message to mask the panel with, while the file is uploading
     * @type String
     */
	waitMsg: 'Uploading',
	
	/**
	 * A validation state to initialize it with
	 * @type Boolean
	 */
	validState: false,
	
	/**
	 * Extra parameters to send with the upload
	 * @type Object
	 */
	baseParams: null,
	
	/**
	 * A list of file types to allow for upload
	 */
	filetypeList: ['gif', 'jpg', 'png'],
    
    initComponent: function(){    	    	
        
        this.browseBtn = new Ext.ux.form.BrowseButton({
        	xtype: 'browsebutton',
			debug: false,
            handler: this.browseFile,
            scope: this,
            iconCls: 'browse-btn',
            inputFileName: this.inputFileName
        });
        
    	Ext.apply(this, {
    		frame: true,
        	id: Ext.id(null, 'screenshot'),
        	width: this.width,
        	height: this.height + 36,
        	buttonAlign: 'right',
        	cls: 'x-screenshotpanel',
        	buttons: [
        		this.browseBtn
        	]
        });
        Ext.ux.ScreenshotUploadPanel.superclass.initComponent.apply(this, arguments);
        
        this.emptyUrl = this.emptyUrl || Ext.BLANK_IMAGE_URL;
        if(this.screenshotUrl.trim() === ''){
        	this.screenshotUrl = this.emptyUrl;
        }
        
        this.parentForm = null;
        this.setValidState(this.validState);
        
        this.addEvents({
        	'uploaded': true
        });
        
        var dynRegex = /.*/;
		if (this.filetypeList && this.filetypeList instanceof Array) {
			var dynRegexStr = '\\w+\\.(';
			dynRegexStr += this.filetypeList.join('|');
			dynRegexStr += ')$';
			
			dynRegex = new RegExp(dynRegexStr);
		}
		this.regex = dynRegex;
    },
    
    onRender: function(){
    	Ext.ux.ScreenshotUploadPanel.superclass.onRender.apply(this, arguments);
    	this.imgViewPanel = new Ext.Panel({
            frame: false,
            border: false, 
            html: "<img src='' />"
        });
        this.add(this.imgViewPanel);
        this.doLayout();
        
        this.mask = new Ext.LoadMask(this.getEl(), {
        	msg: this.waitMsg
        });
        this.mask.hide();
    	this.setView(this.screenshotUrl);
    },
    
    setView: function(v){
    	var src = (v === null || v === undefined ? this.emptyUrl : v);    	
        var img = this.imgViewPanel.getEl().child('img', true);
        img.src = src;
    },
    
    getView: function(){
    	var img = this.imgViewPanel.getEl().child('img', true);
        return img.src;
    },  
    
    getViewPanel: function(){
    	return this.imgViewPanel;
    },
    
    setValidState: function(v){
    	this.validState = v;
    },
    
    getValidState: function(){
    	return this.validState;
    },
    
    getEmptyUrl: function(){
    	return this.emptyUrl;
    },
    
    browseFile: function(){    	
    	if (!this.screenshotForm) {
    		this.parentForm = this.findParentByType('form');
    		if(this.parentForm){
    			this.screenshotForm = this.parentForm;
    		}else{
    			var screenshotFormEl = this.body.createChild({
	                tag: 'form',
	                style: 'display:none'
	            });            
	            this.screenshotForm = new Ext.form.BasicForm(screenshotFormEl, {
	                url: this.uploadUrl, 
	                fileUpload: true
	            }); 
    		}	                     
        }
        
        // do the upload 
        this.inputFileEl = this.browseBtn.detachInputFile(false);                                       
        var oParams = Ext.apply({
        	success: this.onSuccess,
            failure: this.onFailure,
            scope: this
        }, {
        	params: this.baseParams || {}
        });
        
        if(this.validate()){
        	this.mask.show();
	        if(this.parentForm){
	        	this.inputFileEl.addClass('x-hidden');
	        	this.inputFileEl = this.inputFileEl.appendTo(this.screenshotForm.getForm().getEl());
	        	        
	    		this.screenshotForm.getForm().submit(Ext.apply(oParams, {
	        		clientValidation: false
	        	}));        	
	        }else{
	        	this.inputFileEl = this.inputFileEl.appendTo(this.screenshotForm.getEl());
	        	this.screenshotForm.submit(oParams);        	
	        }
        }	        	        
    },
    
    validate: function(v){    	        
        if(this.regex && !this.regex.test(this.inputFileEl.dom.value)){
            return false;
        }
        return true;
    },
        
    onSuccess: function(form, action){
        this.inputFileEl.remove();                
        this.mask.hide();
        this.screenshotUrl = action.result.screenshotUrl;
        this.setView(this.screenshotUrl);
        this.setValidState(action.result.validState);
        
        this.fireEvent('uploaded', this);
    },
        
    onFailure: function(form, action){
        this.inputFileEl.remove();
        this.mask.hide();
        this.handleFailure(action.result, action.result.errors);
        this.setValidState(false);
        
        this.fireEvent('uploaded', this);
    },
    
    handleFailure: function(result, errors){    	
    	if(!this.errorMsgTpl){
    		this.errorMsgTpl = new Ext.XTemplate(
	        	'<p>Upload Errors : </p>', 
	        	'<tpl for="errors">', 
	        		'<p>- {.}</p>', 
	        	'</tpl>'
	        );
    	}
    	Ext.Msg.show({
            title: 'Upload Failed',
            msg: errors ? this.errorMsgTpl.applyTemplate(result) : "<p>Your Screenshot Was Not Uploaded</p>",
            buttons: Ext.Msg.OK,
            minWidth: 300
        });
    }
    
});

Ext.reg('screenshotupload', Ext.ux.ScreenshotUploadPanel);