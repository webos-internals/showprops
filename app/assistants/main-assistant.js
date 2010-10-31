function MainAssistant()
{
	this.props = $H({
		BATToCH:		false,
		BATToRSP:		false,
		BToADDR:		false,
		DMCARRIER:		false,
		DMCLoAUTHNAME:	false,
		DMCLoAUTHPW:	false,
		DMCLoNONCE:		false,
		DMMODEL:		false,
		DMSETS:			false,
		DMSVRoAUTHPW:	false,
		DMSVRoNONCE:	false,
		ACCELCAL:		false,
		HWoRev:			false,
		KEYoBRD:		false,
		ModemSN:		false,
		PN:				false,
		PRODoID:		false,
		PalmSN:			false,
		ProdSN:			false,
		WIFIoADDR:		false,
		installer:		false,
		MfgCode:		false,
		ALSCal:			false,
		SimLockDef:		false
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
		
		this.dataTemplate = 'main/row-template';
		this.listContainer.update('');
		
		this.props.each(function(pair) {
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
		var type = typeof value;
		if (type == 'object') value = Object.toJSON(value);
		
		this.props.set(name, value);
		
		var obj =
		{
			id: name,
			title: name,
			/*rowClass: (p==(this.props.length-1)?'last':''),*/
			data: value
		};
		
		this.listContainer.insert({bottom: Mojo.View.render ({object: obj, template: this.dataTemplate})});
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
	if (value == "copy")
	{
		var xml = "<Section name=\"tokens\" type=\"token\" size=\"4KB\">\n";
		
		this.props.each(function(pair) {
			if (pair.value !== false) {
				v = pair.value.replace(/"/gi, '\\"');
				xml += "    <Val name=\""+pair.key+"\" value=\""+v+"\"/>\n";
			}
		}, this);
		
		xml += "</Section>\n";
		
		this.controller.stageController.setClipboard(xml);
	}
	else if (value == "email")
	{
		var xml = "&lt;Section name=\"tokens\" type=\"token\" size=\"4KB\"&gt;<br>";
		this.props.each(function(pair) {
			if (pair.value !== false) {
				v = pair.value.replace(/"/gi, '\\"');
				xml += "&nbsp;&nbsp;&nbsp;&nbsp;&lt;Val name=\""+pair.key+"\" value=\""+v+"\"/&gt;<br>";
			}
		}, this);
		xml += "&lt;/Section&gt;<br>";
		
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
		                text: '<html><body>'+xml+'</body></html>'
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
