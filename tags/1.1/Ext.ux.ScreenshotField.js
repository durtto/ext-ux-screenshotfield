
/*
 * This is a component that builds on the work of lopeky (BrowseButton)
 * It allows for upload of files to the server
 * 
 * @class Ext.ux.ScreenshotField
 * @extends Ext.form.Field
 * 
 * @author Charles Opute Odili (chalu)
 * @version 1.1 Beta
 * @license GPLv3
 */
Ext.ux.ScreenshotField = Ext.extend(Ext.form.Field, {
	/**
	 * If an upload is mandatory
	 * @type Boolean
	 */
	allowBlank: true,			
	
	/**
	 * A list of file types to allow for upload
	 */
	filetypeList: ['gif', 'jpg', 'png'],	  
    
    /**
     * The width of the screenshot
     * @type Number
     */
    width: 80,
    
    /**
     * The height of the screenshot
     * @type Number
     */
    height: 90,
    
    /**
     * The upload URL for the screenshot, if not specified
     * the url of the field's form is assumed 
     * @type String
     */
    uploadUrl: null,    
    
    /**
     * The URL to an existing screenshot
     * to initialize the view with.
     * It will be replaced with the upload
     * @type String
     */
    emptyUrl: Ext.BLANK_IMAGE_URL,
    
    /**
     * The name the file upload is submited with, also serves
     * as the name of this input field
     * @type String
     */
    name: 'screenshot',                
    
    /**
     * A message to mask the panel with, while the file is uploading
     * @type String
     */
	waitMsg: 'Uploading',
	
	/**
	 * A validation state to initialize it with. The field may 
	 * already have a screenshot that is valid (from an existing upload maybe),
	 * this enables us not to treat it as 'blank entry' and thus not require an upload.
	 * If set to true, the field will pass validation tests, after the allowBlank tests haved passed. 
	 * @type Boolean
	 */
	validState: false,
	
	/**
	 * Extra parameters to send with the upload
	 * @type Object
	 */
	baseParams: null,	
	
	invalidClass: 'x-screenshotfield-invalid',
    
    initComponent: function(){    	    	
        
    	Ext.apply(this, { 
    		validationEvent: 'change',
		    validationDelay: 1000
    	});
        Ext.ux.ScreenshotField.superclass.initComponent.apply(this, arguments);        
        this.addEvents({
        	'beforeupload': true,
        	'afterupload': true
        });
        
        //setup default listeners
		this.on({
			'beforeupload': {scope:this, fn:this.beforeupload},			
			'afterupload': {scope:this, fn:this.afterupload}
		});
        
        var dynRegex = /.*/;
		if (this.filetypeList && this.filetypeList instanceof Array) {
			var dynRegexStr = '\\w+\\.(';
			dynRegexStr += this.filetypeList.join('|');
			dynRegexStr += ')$';
			
			dynRegex = new RegExp(dynRegexStr);
		}
		this.regex = dynRegex;
		
		this.FLOAT_EL_WIDTH = 60;
		this.FLOAT_EL_HEIGHT = 18;
		
		this.hasChange = false;
        this.setValidState(this.validState);
    },
    
    onRender: function(ct, position){
    	Ext.ux.ScreenshotField.superclass.onRender.call(this, ct, position);
        this.el.dom.style.border = '0 none';
        this.el.dom.setAttribute('tabIndex', -1);
        this.el.addClass('x-hidden');
        if(Ext.isIE){ 
            this.el.applyStyles('margin-top:-1px;margin-bottom:-1px;')
        }
        
        this.wrap = this.el.wrap({
            cls:'x-screenshotfield-wrap'
        });
        
        if(this.tabIndex !== undefined){
            this.wrap.dom.setAttribute('tabIndex', this.tabIndex);
        } 
        
        this.boxWrap = this.wrap.boxWrap().addClass("x-box-blue");
        this.boxWrap.addClass('x-screenshotfield-bwrap');
        this.boxWrap.position('relative'); // this is important!
        
        this.boxWrapWidth = this.width + 25;
        this.boxWrapHeight = this.width + 20;
        this.boxWrap.setWidth(this.boxWrapWidth);
        this.boxWrap.setHeight(this.boxWrapHeight); 
        this.wrap.setWidth(this.width);
        this.wrap.setHeight(this.height);
        
        this.view = this.wrap.createChild({
        	tag: 'img',
        	width: this.width,
        	height: this.height,        	
        	src: this.value,
        	cls: 'x-screenshotfield'
        });
        
        var styleCfg = {
			position: 'absolute',
			overflow: 'hidden',
			top: '0px', // default
			left: '0px' // default			
		};
		// browser specifics for better overlay tightness
		if(Ext.isIE){
			Ext.apply(styleCfg, {
				left: '-3px',
				top: '-3px'
			});
		} else if (Ext.isGecko) {
			Ext.apply(styleCfg, {
				left: '-3px',
				top: '-3px'
			});
		} else if (Ext.isSafari) {
			Ext.apply(styleCfg, {
				left: '-4px',
				top: '-2px'
			});
		}
		this.clipEl = this.boxWrap.createChild({
			tag: 'div',
			style: styleCfg
		});
		
		this.setClipSize();
		this.addClipListeners();		
		this.floatEl = this.clipEl.createChild({
			tag: 'div',
			style: {
				position: 'absolute',
				width: this.FLOAT_EL_WIDTH + 'px',
				height: this.FLOAT_EL_HEIGHT + 'px',
				overflow: 'hidden'
			}
		});		
		
		if(this.debug) {
			this.clipEl.applyStyles({
				'background-color': 'green'
			});
			this.floatEl.applyStyles({
				'background-color': 'red'
			});
		}else{
			this.clipEl.setOpacity(0.0);
		}
		
		// Cover cases where someone tabs to the button:
		// Listen to focus of the button so we can translate the focus to the input file el.
		this.boxWrap.on('focus', this.onFieldFocus, this);
		// In IE, it's possible to tab to the text portion of the input file el.  
		// We want to listen to keyevents so that if a space is pressed, we "click" the input file el.
		if(Ext.isIE) {
			this.boxWrap.on('keydown', this.onFieldKeyDown, this);
		}		
		this.createInputFile();
        
        this.mask = new Ext.LoadMask(this.boxWrap, {
        	msg: this.waitMsg
        });
        this.mask.hide();  
        this.initValue();
    },
    
    getFileBaseName: function(value){
    	if(value){
    		value = value.substring( value.lastIndexOf('/')+1 );
	    	return value;
    	}	
    	return value;
    },
    
    getName: function(){
         return this.rendered ? (this.hiddenName || this.name || this.id) : '';
    },
    
    initValue: function(){
    	this.value = this.value || this.emptyUrl;
    	this.value.trim();
    	this.originalValue = this.value;
    	this.setValue(this.value);
    },
    
    getValue: function(){
    	if(!this.rendered) {
            return Ext.ux.ScreenshotField.superclass.getValue.call(this);
        }
        return this.getScreenshotView();
    },
    
    setValue: function(v){
        Ext.ux.ScreenshotField.superclass.setValue.call(this, v);
        if(this.rendered){
        	this.setScreenshotView(v);
        }        
    },
    
    validateValue: function(value){
    	if( this.getFileBaseName(value) === this.getFileBaseName(this.emptyUrl) ){              
    		if(this.allowBlank){
                 this.clearInvalid();
                 return true;
             }else{
                 this.markInvalid();
                 return false;
             }
        }  
        if(!this.getValidState()){
        	this.markInvalid();
            return false;
        }                 
        return true;
    },
    
    markInvalid: function(msg){     	
        if( !this.rendered|| !this.wrap || !this.hasChange || this.preventMark ){
        	return;        	
        }      
        this.wrap.child('img').replaceClass('x-screenshotfield', this.invalidClass);       
        msg = msg || this.invalidText;
        this.fireEvent('invalid', this, msg);
    },
    
    clearInvalid: function(){
        if(!this.rendered || !this.wrap || this.preventMark){         
        	return;
        }   
        this.wrap.child('img').replaceClass(this.invalidClass, 'x-screenshotfield');        
        this.fireEvent('valid', this);
    },
	
	disable: function(){
		Ext.ux.ScreenshotField.superclass.disable.call(this);
		this.boxWrap.removeClass("x-box-blue");
		this.boxWrap.addClass('x-item-disabled');
		this.removeClipListeners();		
		this.inputFileEl.dom.disabled = true;
	},
	
	enable: function(){
		Ext.ux.ScreenshotField.superclass.enable.call(this);
		this.boxWrap.removeClass('x-item-disabled');
		this.boxWrap.addClass("x-box-blue");		
		this.addClipListeners();
		this.inputFileEl.dom.disabled = false;
	},
    
    setClipSize: function(){
		if (this.clipEl) {
			var width = this.boxWrapWidth;
			var height = this.boxWrapHeight;
			if (Ext.isIE) {
				width = width + 5;
				height = height + 5;
			} else if (Ext.isGecko) {
				width = width + 6;
				height = height + 6;
			} else if (Ext.isSafari) {
				width = width + 6;
				height = height + 6;
			}
			this.clipEl.setSize(width, height);
			
			var fieldItem = this.boxWrap.up('div.x-form-item');
			if(!this.parentForm){
	    		this.parentForm = this.getParentForm();
	    	}
	    	
	    	var alignCfg = this.parentForm.initialConfig.labelAlign;
	    	if(alignCfg !== undefined && alignCfg === 'top'){
	    		// if labelAlign is set to top we have to make up for the extra margin and
	    		// padding that the field label gets 
	    		height += 10;
	    	}
			fieldItem.setHeight(height); // resize to prevent scrolling 
		}
	},
	
	addClipListeners: function(){
		this.clipEl.on({
			'mousemove': this.onButtonMouseMove,
			'mouseover': this.onButtonMouseMove,
			scope: this
		});
	},
	
	removeClipListeners: function(){
		this.clipEl.removeAllListeners();
	},
	
	createInputFile: function(){
		this.inputFileEl = this.floatEl.createChild({
			tag: 'input',
			type: 'file',
			size: 1, // must be > 0. It's value doesn't really matter due to our masking div (inputFileCt).  
			name:  this.uploadName || this.hiddenName || this.name || Ext.id(this.el),
			tabindex: this.tabIndex,
			// Use the same pointer as an Ext.Button would use.  This doesn't work in Firefox.
			// This positioning right-aligns the input file to ensure that the "Browse" button is visible.
			style: {
				position: 'absolute',
				cursor: 'pointer',
				right: '0px',
				top: '0px'
			}
		});
		this.inputFileEl = this.inputFileEl.child('input') || this.inputFileEl;		
		
		// setup events
		this.inputFileEl.on({
			'click': this.onInputFileClick,
			'change': this.onInputFileChange,
			'focus': this.onInputFileFocus,
			'select': this.onInputFileFocus,
			'blur': this.onInputFileBlur,
			scope: this
		});
		
		// add a tooltip
		if (this.tooltip) {
			if (typeof this.tooltip == 'object') {
				Ext.QuickTips.register(Ext.apply({
					target: this.inputFileEl
				}, this.tooltip));
			} else {
				this.inputFileEl.dom[this.tooltipType] = this.tooltip;
			}
		}		
	},
	
	onFieldFocus: function(e){
		if (this.inputFileEl) {
			this.inputFileEl.focus();
			e.stopEvent();
		}
	},
	
	onFieldKeyDown: function(e){
		if (this.inputFileEl && e.getKey() == Ext.EventObject.SPACE) {
			this.inputFileEl.dom.click();
			e.stopEvent();
		}
	},
	
	onButtonMouseMove: function(e){
		var xy = e.getXY();
		xy[0] -= this.FLOAT_EL_WIDTH / 2;
		xy[1] -= this.FLOAT_EL_HEIGHT / 2;
		this.floatEl.setXY(xy);
	},
	
	onInputFileFocus: function(e){
		if (!this.isDisabled) {
			//this.boxWrap.addClass("x-box-blue");
		}
	},
	
	onInputFileBlur: function(e){
		//this.boxWrap.removeClass("x-box-blue");
	},

	onInputFileClick: function(e){
		e.stopPropagation();
	},
	
	onInputFileChange: function(){
		this.browseFile.call(this);
	},
	
	getInputFile: function(){
		return this.inputFileEl;
	},
    
    getParentForm: function(){
    	var form = this.findParentBy(function(cnt){
    		if(cnt.isXType('form')){
    			return true;
    		}    		
    	}, this);
    	return form;
    },
    
    setScreenshotView: function(v){
    	if(this.view){
    		var src = (v === null || v === undefined ? Ext.BLANK_IMAGE_URL : v);    	
	        this.view.dom.src = src;
    	}	    	
    },
    
    getScreenshotView: function(){
    	if(this.view){
    		return this.view.dom.src;
    	}
        return this.value;
    },
    
    setValidState: function(v){
    	if(v !== undefined && v !== null){
    		this.validState = v;
    	}    	
    },
    
    getValidState: function(){
    	return this.validState;
    },
    
    setUploadURL: function(url){
    	this.uploadUrl = url;
    },
    
    browseFile: function(){ 
        // do the upload  
    	if(!this.parentForm){
    		this.parentForm = this.getParentForm();
    	}    	
        var oParams = Ext.apply({  
        	scope: this,
        	success: this.onSuccess,
            failure: this.onFailure,
            url: this.uploadUrl || this.parentForm.initialConfig.url            
        }, {
        	params: this.baseParams || {}
        });
        
        if(this.fireEvent('beforeupload', this) === true){
        	this.mask.show();        	        	        	        
        	this.inputFileEl.addClass('x-hidden');
        	var form = this.parentForm.getForm();
        	this.inputFileEl = this.inputFileEl.appendTo(form.getEl());
        	        
    		form.submit(Ext.apply(oParams, {
        		clientValidation: false
        	})); 
        }	        	        
    },
    
    beforeupload: function(){  
    	if(this.regex && !this.regex.test(this.inputFileEl.dom.value)){
            return false;
        }
        return true;
    },
    
    afterupload: function(field, result){
    	this.inputFileEl.remove();
        this.mask.hide(); 
        this.createInputFile();
    },
        
    onSuccess: function(form, action){
    	var result = action.result;
    	this.setValue(result.screenshotUrl);
        this.hasChange = true;	
        this.setValidState(result.validState);
        this.fireEvent('afterupload', this, result);
        this.validate();
    },
        
    onFailure: function(form, action){
    	var result = action.result;
    	this.setValidState(false);
    	this.handleErrors(result, result.errors);
        this.fireEvent('afterupload', this, result);
    },
    
    handleErrors: function(result, errors){    	
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

Ext.reg('screenshotfield', Ext.ux.ScreenshotField);