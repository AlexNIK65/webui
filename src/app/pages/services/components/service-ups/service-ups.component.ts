import {ApplicationRef, Component, Injector, OnInit} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  Validators
} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';


import {
  RestService,
  SystemGeneralService,
  WebSocketService
} from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import {
  matchOtherValidator
} from '../../../common/entity/entity-form/validators/password-validation';
import { T } from '../../../../translate-marker';

@Component({
  selector : 'ups-edit',
  template : `<entity-form [conf]="this"></entity-form>`,
})

export class ServiceUPSComponent {
  protected ups_driver: any;
  protected ups_port: any;
  protected resource_name: string = 'services/ups';
  protected route_success: string[] = [ 'services' ];

  public fieldConfig: FieldConfig[] = [
    {
      type : 'select',
      name : 'ups_mode',
      placeholder : T('UPS Mode'),
      tooltip : T('Choose <i>Master</i> if the UPS is plugged directly\
                   into the system serial port. The UPS will remain the\
                   last item to shut down. Choose <i>Slave</i> to have\
                   this system shut down before <i>Master</i>. See the\
                   <a href="http://networkupstools.org/docs/user-manual.chunked/ar01s02.html#_monitoring_client"\
                   target="_blank">Network UPS Tools Overview</a>.'),
      options : [
        {label : 'Master', value : 'master'},
        {label : 'Slave', value : 'slave'},
      ]
    },
    {
      type : 'input',
      name : 'ups_identifier',
      placeholder : T('Identifier'),
      tooltip : T('Describe the UPS device. It can contain alphanumeric,\
                   period, comma, hyphen, and underscore characters.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'select',
      name : 'ups_driver',
      placeholder : T('Driver'),
      tooltip : T('See the <a\
                   href="http://networkupstools.org/stable-hcl.html"\
                   target="_blank">Network UPS Tools compatibility\
                   list</a> for a list of supported UPS devices.'),
      required: true,
      options: [],
      validation : [ Validators.required ]
    },
    {
      type : 'input', //fixme - this should be a select but we need api for options
      name : 'ups_port',
      placeholder : T('Port'),
      //options: [],
      tooltip : T('Enter the serial or USB port the UPS is plugged into.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'textarea',
      name : 'ups_options',
      placeholder : T('Auxiliary Parameters (ups.conf)'),
      tooltip : T('Enter any extra options from <a\
                   href="http://networkupstools.org/docs/man/ups.conf.html"\
                   target="_blank">UPS.CONF(5)</a>.'),
    },
    {
      type : 'textarea',
      name : 'ups_optionsupsd',
      placeholder : T('Auxiliary Parameters (upsd.conf)'),
      tooltip : T('Enter any extra options from <a\
                   href="http://networkupstools.org/docs/man/upsd.conf.html"\
                   target="_blank">UPSD.CONF(5)</a>.'),
    },
    {
      type : 'input',
      name : 'ups_description',
      placeholder : T('Description'),
      tooltip : T('Describe this service.'),
    },
    {
      type : 'select',
      name : 'ups_shutdown',
      placeholder : T('Shutdown Mode'),
      tooltip : T('Choose when the UPS initiates shutdown.'),
      options : [
        {label : 'UPS reaches low battery', value : 'lowbatt'},
        {label : 'UPS goes on battery', value : 'batt'},
      ]
    },
    {
      type : 'input',
      inputType: 'number',
      name : 'ups_shutdowntimer',
      placeholder : T('Shutdown Timer'),
      tooltip : T('Enter a value in seconds for the the UPS to wait\
                   before initiating shutdown. Shutdown will not occur\
                   if power is restored while the timer is counting\
                   down. This value only applies when <b>Shutdown\
                   mode</b> is set to <i>UPS goes on battery</i>.'),
    },
    {
      type : 'input',
      name : 'ups_shutdowncmd',
      placeholder : T('Shutdown Command'),
      tooltip : T('Enter a command to shut down the system when either\
                   battery power is low or the shutdown timer ends.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type: 'input',
      inputType: 'number',
      name: 'ups_nocommwarntime',
      placeholder: T('No Communication Warning Time'),
      tooltip: T('Enter a number of seconds to wait before alerting that\
                  the service cannot reach any UPS. Warnings continue\
                  until the situation is fixed.'),
      value: `300`,
    },
    {
      type : 'input',
      name : 'ups_monuser',
      placeholder : T('Monitor User'),
      tooltip : T('Enter a user to associate with this service. Keeping\
                   the default is recommended.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'ups_monpwd',
      inputType: 'password',
      placeholder : T('Monitor Password'),
      tooltip : T('Change the default password to improve system\
                   security. The new password cannot contain a\
                   space or <b>#</b> .'),
    },
    {
      type : 'textarea',
      name : 'ups_extrausers',
      placeholder : T('Extra Users(upsd.conf)'),
      tooltip : T('Enter accounts that have administrative access.\
                   See <a\
                   href="http://networkupstools.org/docs/man/upsd.users.html"\
                   target="_blank">upsd.users(5)</a> for examples.'),
    },
    {
      type : 'checkbox',
      name : 'ups_rmonitor',
      placeholder : T('Remote Monitor'),
      tooltip : T('Set for the default configuration to listen on all\
                   interfaces using the known values of user:\
                   <i>upsmon</i> and password: <i>fixmepass</i>.'),
    },
    {
      type : 'checkbox',
      name : 'ups_emailnotify',
      placeholder : T('Send Email Status Updates'),
      tooltip : T('Set enable sending messages to the address defined in\
                   the <b>Email</b> field.'),
    },
    {
      type : 'input',
      name : 'ups_toemail',
      placeholder : T('Email'),
      tooltip : T('Enter any email addresses to receive status updates.\
                   Separate multiple addresses with a <b>;</b> .'),
    },
    {
      type : 'input',
      name : 'ups_subject',
      placeholder : T('Email Subject'),
      tooltip : T('Enter the subject for status emails.'),
    },
    {
      type : 'checkbox',
      name : 'ups_powerdown',
      placeholder : T('Power Off UPS'),
      tooltip : T('Set for the UPS to power off after shutting down the\
                   system.'),
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              ) {}

  afterInit(entityEdit: any) {
    this.ups_driver = _.find(this.fieldConfig, { name: 'ups_driver' });
    this.ws.call('notifier.choices', ['UPSDRIVER_CHOICES']).subscribe((res) => {
      for (let item of res) {
        this.ups_driver.options.push({ label: item[1], value: item[0] });
      }
    });
  }
}
