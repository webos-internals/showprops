function MainAssistant()
{
	this.properties =
	[
		{name: 'ACCELCAL'},
		{name: 'BATToCH'},
		{name: 'BATToRSP'},
		{name: 'BToADDR'},
		{name: 'DMCARRIER'},
		{name: 'DMCLoAUTHNAME'},
		{name: 'DMCLoAUTHPW'},
		{name: 'DMCLoNONCE'},
		{name: 'DMMODEL'},
		{name: 'DMSETS'},
		{name: 'DMSVRoAUTHPW'},
		{name: 'DMSVRoNONCE'},
		{name: 'HWoRev'},
		{name: 'KEYoBRD'},
		{name: 'ModemSN'},
		{name: 'PN'},
		{name: 'PRODoID'},
		{name: 'PalmSN'},
		{name: 'ProdSN'},
		{name: 'WIFIoADDR'},
		{name: 'installer'}
	];
}

MainAssistant.prototype.setup = function()
{
	try 
	{
		this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, { visible: false });
		
		var html = '';
		var dataTemplate = 'main/row-template';
		
		for (var p = 0; p < this.properties.length; p++) 
		{
			var obj =
			{
				id: this.properties[p].name,
				title: this.properties[p].name,
				rowClass: (p==(this.properties.length-1)?'last':''),
				data: '&nbsp;'
			};
			html += Mojo.View.render
			(
				{
					object: obj,
					template: dataTemplate
				}
			);
		}
		
		this.controller.get('data').innerHTML = html;
		
		for (var p = 0; p < this.properties.length; p++) 
		{
			this.dataRequest(this.properties[p]);
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'main#setup');
		this.message('main#setup', e);
	}
}

MainAssistant.prototype.dataRequest = function(obj)
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
					'key': 'com.palm.properties.' + obj.name
				},
				onSuccess: this.dataResponse.bind(this, obj)
			}
		);
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'main#dataRequest');
		this.message('main#dataRequest', e);
	}
}

MainAssistant.prototype.dataResponse = function(obj, payload)
{
	try 
	{
		this.controller.get('data-' + obj.name).innerHTML = payload['com.palm.properties.' + obj.name];
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'main#dataResponse');
		this.message('main#dataResponse', e);
	}
}

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
