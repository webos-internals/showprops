function MainAssistant()
{
	this.props = $H({
		ACCELCAL:		{data: false, genComms: false},
		ALSCal:			{data: false, genComms: false},
		BATToCH:		{data: false, genComms: true},
		BATToRSP:		{data: false, genComms: true},
		BToADDR:		{data: false, genComms: false},
		DMCARRIER:		{data: false, genComms: true},
		DMCLoAUTHNAME:	{data: false, genComms: true},
		DMCLoAUTHPW:	{data: false, genComms: true},
		DMCLoNONCE:		{data: false, genComms: true},
		DMMODEL:		{data: false, genComms: true},
		DMSETS:			{data: false, genComms: false},
		DMSVRoAUTHPW:	{data: false, genComms: true},
		DMSVRoNONCE:	{data: false, genComms: true},
		FlashSize:		{data: false, genComms: false},
		GYROCAL:		{data: false, genComms: false},
		HousingA:		{data: false, genComms: false},
		HWoRev:			{data: false, genComms: false},
		KEYoBRD:		{data: false, genComms: false},
		MODEM:			{data: false, genComms: false},
		MfgCode:		{data: false, genComms: false},
		ModemSN:		{data: false, genComms: true},
		PN:				{data: false, genComms: false},
		PRODoID:		{data: false, genComms: false},
		PROXCAL:		{data: false, genComms: false},
		PalmSN:			{data: false, genComms: false},
		ProdSN:			{data: false, genComms: false},
		ProductName:	{data: false, genComms: false},
		ProductSKU:		{data: false, genComms: false},
		RadioType:		{data: false, genComms: false},
		RamSize:		{data: false, genComms: false},
		SimLockDef:		{data: false, genComms: true},
		WIFIoADDR:		{data: false, genComms: false}
	});
	
	this.menuModel =
	{
		visible: true,
		items:
		[
			{
				label: $L("Generate Tokens File"),
				items:
				[
					{
						label: $L("Comms Board Swap"),
						command: 'do-gen-comms'
					},
					{
						label: $L("Full"),
						command: 'do-gen-full'
					}
				]
			}
		]
	};
};

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
};

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
};
MainAssistant.prototype.dataResponse = function(name, payload)
{
	try 
	{
		var value = payload['com.palm.properties.' + name];
		var type = typeof value;
		if (type == 'object') value = Object.toJSON(value);
		
		var prop = this.props.get(name);
		this.props.set(name, {data: value, genComms: prop.genComms});
		
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
};

MainAssistant.prototype.handleCommand = function(event)
{
	if (event.type == Mojo.Event.command)
	{
		switch (event.command)
		{
			case 'do-gen-full':
			case 'do-gen-comms':
			
				this.controller.showAlertDialog(
				{
				    title:				(event.command == 'do-gen-full' ? $L("Full Tokens") : $L("Comms Board Tokens")),
					allowHTMLMessage:	true,
				    message:			$L("What would you like to do with it?"),
				    choices:			[
											{label:$L("Copy To Clipboard"), value:'copy'},
											{label:$L("Email"),				value:'email'}
										],
					onChoose:			this.xmlGenResponse.bindAsEventListener(this, event.command)
			    });
				
				break;
		}
	}
};
MainAssistant.prototype.xmlGenResponse = function(action, type)
{
	if (action == "copy")
	{
		var xml = "<Section name=\"tokens\" type=\"token\" size=\"4KB\">\n";
		
		this.props.each(function(pair) {
			if (pair.value.data !== false) {
				if (type == 'do-gen-full' ||
					(type == 'do-gen-comms' && pair.value.genComms === true)) {
					v = pair.value.data.replace(/"/gi, "'");                                                      //');
					xml += "    <Val name=\""+pair.key+"\" value=\""+v+"\"";
					if (type == 'do-gen-comms') {
						xml += " action=\"overwrite\"";
					}
					xml += "/>\n";
				}
			}
		}, this);
		
		xml += "</Section>\n";
		
		this.controller.stageController.setClipboard(xml);
		
		Mojo.Controller.appController.showBanner
		(
			{
				icon: 'icon.png',
				messageText: 'Tokens File Copied to Clipboard...',
				soundClass: ''
			},
			{},
			'tokensXmlCopy'
		);
	}
	else if (action == "email")
	{
		var xml = "&lt;Section name=\"tokens\" type=\"token\" size=\"4KB\"&gt;<br>";
		this.props.each(function(pair) {
			if (pair.value.data !== false) {
				if (type == 'do-gen-full' ||
					(type == 'do-gen-comms' && pair.value.genComms === true)) {
					v = pair.value.data.replace(/"/gi, "'");                                                      //');
					xml += "&nbsp;&nbsp;&nbsp;&nbsp;&lt;Val name=\""+pair.key+"\" value=\""+v+"\"";
					if (type == 'do-gen-comms') {
						xml += " action=\"overwrite\"";
					}
					xml += "/&gt;<br>";
				}
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
		                summary: "Tokens File",
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
};

MainAssistant.prototype.activate = function(event) {}
MainAssistant.prototype.deactivate = function(event) {}
MainAssistant.prototype.cleanup = function(event) {}

// Local Variables:
// tab-width: 4
// End:
