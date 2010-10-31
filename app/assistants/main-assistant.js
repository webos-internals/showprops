function MainAssistant()
{
	this.props = $H({
		BATToCH:		{data: false, genComms: true},
		BATToRSP:		{data: false, genComms: true},
		BToADDR:		{data: false, genComms: true},
		DMCARRIER:		{data: false, genComms: true},
		DMCLoAUTHNAME:	{data: false, genComms: true},
		DMCLoAUTHPW:	{data: false, genComms: true},
		DMCLoNONCE:		{data: false, genComms: true},
		DMMODEL:		{data: false, genComms: true},
		DMSETS:			{data: false, genComms: true},
		DMSVRoAUTHPW:	{data: false, genComms: true},
		DMSVRoNONCE:	{data: false, genComms: true},
		ACCELCAL:		{data: false, genComms: true},
		HWoRev:			{data: false, genComms: true},
		KEYoBRD:		{data: false, genComms: true},
		ModemSN:		{data: false, genComms: true},
		PN:				{data: false, genComms: true},
		PRODoID:		{data: false, genComms: true},
		PalmSN:			{data: false, genComms: true},
		ProdSN:			{data: false, genComms: true},
		WIFIoADDR:		{data: false, genComms: true},
		installer:		{data: false, genComms: true},
		MfgCode:		{data: false, genComms: true},
		ALSCal:			{data: false, genComms: true},
		SimLockDef:		{data: false, genComms: true}
	});
	
	this.menuModel =
	{
		visible: true,
		items:
		[
			{
				label: $L("Generate castle.xml"),
				items:
				[
					{
						label: $L("Comms Board"),
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
				    title:				(event.command == 'do-gen-full' ? $L("Full castle.xml") : $L("Comms Board castle.xml")),
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
					v = pair.value.data.replace(/"/gi, '\\"');
					xml += "    <Val name=\""+pair.key+"\" value=\""+v+"\"/>\n";
				}
			}
		}, this);
		
		xml += "</Section>\n";
		
		this.controller.stageController.setClipboard(xml);
		
		Mojo.Controller.appController.showBanner
		(
			{
				icon: 'icon.png',
				messageText: 'castle.xml Copied to Clipboard...',
				soundClass: ''
			},
			{},
			'castleXmlCopy'
		);
	}
	else if (action == "email")
	{
		var xml = "&lt;Section name=\"tokens\" type=\"token\" size=\"4KB\"&gt;<br>";
		this.props.each(function(pair) {
			if (pair.value.data !== false) {
				if (type == 'do-gen-full' ||
					(type == 'do-gen-comms' && pair.value.genComms === true)) {
					v = pair.value.data.replace(/"/gi, '\\"');
					xml += "&nbsp;&nbsp;&nbsp;&nbsp;&lt;Val name=\""+pair.key+"\" value=\""+v+"\"/&gt;<br>";
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
};

MainAssistant.prototype.activate = function(event) {}
MainAssistant.prototype.deactivate = function(event) {}
MainAssistant.prototype.cleanup = function(event) {}

// Local Variables:
// tab-width: 4
// End:
