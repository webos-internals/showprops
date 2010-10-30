function MainAssistant()
{
	this.props = $H({
		ACCELCAL:		'',
		BATToCH:		'',
		BATToRSP:		'',
		BToADDR:		'',
		DMCARRIER:		'',
		DMCLoAUTHNAME:	'',
		DMCLoAUTHPW:	'',
		DMCLoNONCE:		'',
		DMMODEL:		'',
		DMSETS:			'',
		DMSVRoAUTHPW:	'',
		DMSVRoNONCE:	'',
		HWoRev:			'',
		KEYoBRD:		'',
		ModemSN:		'',
		PN:				'',
		PRODoID:		'',
		PalmSN:			'',
		ProdSN:			'',
		WIFIoADDR:		'',
		installer:		''
	});
	
	this.menuModel =
	{
		visible: true,
		items:
		[
			{
				label: $L("Generate castle.xml"),
				command: 'do-gen'
			}
		]
	};
}

MainAssistant.prototype.setup = function()
{
	try 
	{
		this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, this.menuModel);
		
		this.listContainer = this.controller.get('data');
		
		var dataTemplate = 'main/row-template';
		this.listContainer.update('');
		
		this.props.each(function(pair) {
			
			var obj =
			{
				id: pair.key,
				title: pair.key,
				/*rowClass: (p==(this.props.length-1)?'last':''),*/
				data: '&nbsp;'
			};
			
			this.listContainer.insert({bottom: Mojo.View.render ({object: obj, template: dataTemplate})});
			
			this.dataRequest(pair.key);
			
		}, this);
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'main#setup');
		this.message('main#setup', e);
	}
}

MainAssistant.prototype.dataRequest = function(name)
{
	try 
	{
		this.controller.serviceRequest
		(
			'palm://com.palm.preferences/systemProperties',
			{
				method: 'Get',
				parameters:
				{
					'key': 'com.palm.properties.' + name
				},
				onSuccess: this.dataResponse.bind(this, name)
			}
		);
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'main#dataRequest');
		this.message('main#dataRequest', e);
	}
}
MainAssistant.prototype.dataResponse = function(name, payload)
{
	try 
	{
		var value = payload['com.palm.properties.' + name];
		this.controller.get('data-' + name).innerHTML = value;
		
		var type = typeof value;
		if (type == 'object') value = Object.toJSON(value);
		
		this.props.set(name, value);
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'main#dataResponse');
		this.message('main#dataResponse', e);
	}
}

MainAssistant.prototype.handleCommand = function(event)
{
	if (event.type == Mojo.Event.command)
	{
		switch (event.command)
		{
			case 'do-gen':
				this.controller.showAlertDialog(
				{
				    title:				$L("castle.xml"),
					allowHTMLMessage:	true,
				    message:			$L("What would you like to do?"),
				    choices:			[
											{label:$L("Copy To Clipboard"), value:'copy'},
											{label:$L("Email"),				value:'email'}
										],
					onChoose:			this.xmlGenResponse.bindAsEventListener(this)
			    });
				
				break;
		}
	}
};
MainAssistant.prototype.xmlGenResponse = function(value)
{
	var xml = '<Section name="tokens" type="token" size="4KB">';
	
	this.props.each(function(pair) {
		
		xml += '<Val name="'+pair.key+'" value="'+pair.value+'"/>';
		
	}, this);
	
	xml += '</Section>';
	
	
	if (value == "copy")
	{
		this.controller.stageController.setClipboard(xml);
	}
	else if (value == "email")
	{
		this.controller.serviceRequest
		(
	    	"palm://com.palm.applicationManager",
			{
		        method: 'open',
		        parameters:
				{
		            id: "com.palm.app.email",
		            params:
					{
		                summary: "castle.xml",
		                text: xml.escapeHTML()
		            }
		        }
		    }
		);
	}
};

MainAssistant.prototype.message = function(title, message)
{
	this.controller.showAlertDialog(
	{
	    title:				title,
	    message:			message,
		allowHTMLMessage:	true,
	    choices:			[{label:$L('Ok'), value:''}],
		onChoose:			function(value){}
    });
}

MainAssistant.prototype.activate = function(event) {}
MainAssistant.prototype.deactivate = function(event) {}
MainAssistant.prototype.cleanup = function(event) {}
