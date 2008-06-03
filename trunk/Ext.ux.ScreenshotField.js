/*
 * A usage of Ext.ux.ScreenshotUploadPanel for upload of files
 * within forms (as a form field)
 * 
 * @class Ext.ux.ScreenshotField
 * @extends Ext.form.Field
 * 
 * @author Charles Opute Odili (chalu)
 * @version 1.0 Beta
 * @license GPLv3
 */
Ext.ux.ScreenshotField = Ext.extend(Ext.form.Field, {        
	/**
	 * If an upload is mandatory
	 * @type Boolean
	 */
	allowBlank: true,
	
	/**
	 * Extra parameters to send with the upload
	 * @type Object
	 */
	baseParams: null,
	
	invalidClass: 'x-screenshotfield-invalid',
	
	/**
	 * A list of file types to allow for upload
	 */
	filetypeList: ['gif', 'jpg', 'png'],	  
    
    /**
     * The width of the bounding panel
     * @type Number
     */
    boxWidth: 100,
    
    /**
     * The height of the bounding panel
     * @type Number
     */
    boxHeight: 110,
    
    initComponent: function(){    	    	              	
        Ext.ux.ScreenshotField.superclass.initComponent.apply(this, arguments);
    },
    
    onRender: function(ct, position){
    	Ext.form.Field.superclass.onRender.apply(this, arguments);    	    	
    	
    	this.formPanel = this.getFormPanel();
    	this.field = new Ext.ux.ScreenshotUploadPanel({
    		inputFileName: this.name || this.hiddenName || this.id,
    		width: this.boxWidth,
    		height: this.boxHeight,    		
    		validState: this.allowBlank !== undefined ? this.allowBlank : true,
    		uploadUrl: this.formPanel.initialConfig.url,
    		filetypeList: this.filetypeList,
    		baseParams: this.baseParams,
    		listeners: {
    			'uploaded': function(){  
    				this.validate();
    			}.createDelegate(this)
    		}
    	});
    	
        this.formPanel.add(this.field); 
        this.formPanel.doLayout();
        if(!this.el){
        	this.el = this.field.getEl();
	        this.el.addClass('x-screenshotfield');
	        this.el.addClass([this.fieldClass, this.cls]);
	        
	       	this.input = this.formPanel.getForm().getEl().createChild({
	        	tag: 'input',
	        	type: 'text',
	        	size: '1',
	        	style: 'position:absolute;top: -1000px;left: -1000px;'
	        });
	        
			if(this.tabIndex !== undefined){
	            this.el.dom.setAttribute('tabIndex', this.tabIndex);
	        } 
        }	  
        
               
        this.initValue();         
    },
    
    getFormPanel: function(){
    	var form = this.findParentByType('form');
    	return form;
    },
    
    getFileBaseName: function(value){
    	value = value.substring( value.lastIndexOf('/')+1 );
    	return value;
    },
    
    getName: function(){
         return this.rendered && this.field.inputFileName ? this.field.inputFileName : (this.hiddenName || '');
    },
    
    initValue: function(){
    	this.originalValue = this.value;
    	this.setValue(this.value);
    },
    
    getValue : function(){
        if(!this.rendered) {
            return this.value;
        }
        var v = this.field.getView();
        return v;
    },
    
    getRawValue : function(v){
    	return this.getValue();
    },
    
    setValue : function(v){
        this.value = v;
        if(this.rendered){  
        	this.field.setView(v);
            this.validate();
        }
        this.input.set({value: v});
    },
    
    validateValue: function(value){
    	if( this.getFileBaseName(value) === this.getFileBaseName(this.field.getEmptyUrl()) ){              
    		if(this.allowBlank){
                 this.clearInvalid();
                 return true;
             }else{
                 this.markInvalid();
                 return false;
             }
        }        
        if(!this.field.getValidState()){
        	this.markInvalid();
            return false;
        }                 
        return true;
    },
    
    markInvalid : function(msg){ 
        if( !this.rendered || this.preventMark || (this.getFileBaseName(this.getValue()) === this.getFileBaseName(this.originalValue)) ){
        	return;        	
        }
        this.field.getViewPanel().getEl().addClass(this.invalidClass);
        this.fireEvent('invalid', this, msg);
    },
    
    clearInvalid : function(){
        if(!this.rendered || this.preventMark){         
        	return;
        }
        this.field.getViewPanel().getEl().removeClass(this.invalidClass);
        this.fireEvent('valid', this);
    }
    
});

Ext.reg('screenshotfield', Ext.ux.ScreenshotField);