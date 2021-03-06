import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { FormArray } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { NetworkService, RestService, DialogService, WebSocketService } from '../../../../services';

import { T } from '../../../../translate-marker';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { regexValidator } from '../../../common/entity/entity-form/validators/regex-validation';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { EntityUtils } from '../../../common/entity/utils';
import helptext from '../../../../helptext/network/interfaces/interfaces-form';

@Component({
  selector : 'app-interfaces-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class InterfacesFormComponent implements OnDestroy {

  protected resource_name = 'network/interface/';
  protected route_success: string[] = [ 'network', 'interfaces' ];
  protected isEntity = true;

  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'int_interface',
      placeholder : helptext.int_interface_placeholder,
      tooltip : helptext.int_interface_tooltip,
      required: true,
      validation : helptext.int_interface_validation
    },
    {
      type : 'input',
      name : 'int_name',
      placeholder : helptext.int_name_placeholder,
      tooltip : helptext.int_name_tooltip,
      required: true,
      validation : helptext.int_name_validation
    },
    {
      type : 'checkbox',
      name : 'int_dhcp',
      placeholder : helptext.int_dhcp_placeholder,
      tooltip : helptext.int_dhcp_tooltip,
    },
    {
      type : 'input',
      name : 'int_ipv4address',
      placeholder : helptext.int_ipv4address_placeholder,
      tooltip : helptext.int_ipv4address_tooltip,
      validation : [ regexValidator(this.networkService.ipv4_regex) ],
      relation : [
        {action : "DISABLE", when : [ {name : "int_dhcp", value : true} ]}
      ]
    },
    {
      type : 'select',
      name : 'int_v4netmaskbit',
      placeholder : helptext.int_v4netmaskbit_placeholder,
      tooltip : helptext.int_v4netmaskbit_tooltip,
      options : this.networkService.getV4Netmasks(),
      value: '',
      relation : [
        {action : "DISABLE", when : [ {name : "int_dhcp", value : true} ]}
      ]
    },
    {
      type : 'checkbox',
      name : 'int_ipv6auto',
      placeholder : helptext.int_ipv6auto_placeholder,
      tooltip : helptext.int_ipv6auto_tooltip
    },
    {
      type : 'input',
      name : 'int_ipv6address',
      placeholder : helptext.int_ipv6address_placeholder,
      tooltip : helptext.int_ipv6address_tooltip,
      validation : [ regexValidator(this.networkService.ipv6_regex) ],
      relation : [
        {action : "DISABLE", when : [ {name : "int_ipv6auto", value : true} ]}
      ]
    },
    {
      type : 'select',
      name : 'int_v6netmaskbit',
      placeholder : helptext.int_v6netmaskbit_placeholder,
      tooltip : helptext.int_v6netmaskbit_tooltip,
      options : this.networkService.getV6PrefixLength(),
      value: '',
      relation : [
        {action : "DISABLE", when : [ {name : "int_ipv6auto", value : true} ]}
      ]
    },
    {
      type : 'input',
      name : 'int_options',
      placeholder : helptext.int_options_placeholder,
      tooltip : helptext.int_options_tooltip,
    },
    {
      type: 'array',
      name : 'ipv4_aliases',
      initialCount: 1,
      formarray: [{
        name: 'alias_address',
        placeholder: helptext.alias_address_placeholder,
        tooltip: helptext.alias_address_tooltip,
        type: 'input',
        validation : [ regexValidator(this.networkService.ipv4_regex) ]
      },
      {
        name: 'alias_netmaskbit',
        placeholder: helptext.alias_netmaskbit_placeholder,
        tooltip : helptext.alias_netmaskbit_tooltip,
        type: 'select',
        options : this.networkService.getV4Netmasks(),
        value: '',
      },
      {
        type: 'checkbox',
        name: 'delete',
        placeholder: helptext.delete_placeholder,
        tooltip: helptext.delete_tooltip,
        isHidden: true,
        disabled: true,
      }]
    },
    {
      type: 'array',
      name : 'ipv6_aliases',
      initialCount: 1,
      formarray: [{
        name: 'alias_address',
        placeholder: helptext.alias_address6_placeholder,
        tooltip: helptext.alias_address6_tooltip,
        type: 'input',
        validation : [ regexValidator(this.networkService.ipv6_regex) ]
      },
      {
        name: 'alias_netmaskbit',
        placeholder: helptext.alias_netmaskbit6_placeholder,
        tooltip : helptext.alias_netmaskbit6_tooltip,
        type: 'select',
        options : this.networkService.getV6PrefixLength(),
        value: '',
      },
      {
        type: 'checkbox',
        name: 'delete',
        placeholder: helptext.delete_placeholder6,
        tooltip: helptext.delete_tooltip6,
        isHidden: true,
        disabled: true,
      }]
    },
  ];

  private int_dhcp: any;
  private int_dhcp_subscription: any;
  private int_ipv6auto: any;
  private int_ipv6auto_subscription: any;
  private int_v4netmaskbit: any;
  private int_ipv4address: any;
  private int_v6netmaskbit: any;
  private int_ipv6address: any;
  private int_interface: any;
  private int_interface_fg: any;
  private int_interface_fg_sub: any;
  private int_interface_warning: string;
  private wsint: string;
  private entityForm: any;
  protected ipv4formArray: FormArray;
  protected ipv6formArray: FormArray;
  protected ipv6arrayControl: any;
  protected ipv4arrayControl: any;
  protected initialCount = {'ipv4_aliases':1, 'ipv6_aliases': 1};
  protected initialCount_default = {'ipv4_aliases':1, 'ipv6_aliases': 1};
  public confirmSubmit = false;
  public confirmSubmitDialog = {
    title: T("Save Network Interface Changes"),
    message: T("Network connectivity will be interrupted. Proceed?"),
    hideCheckbox: false
  }

  public custActions: Array<any> = [
    {
      id : 'add_ipv4_alias',
      name : T('Add Additional IPv4 Alias'),
      function : () => {
        this.initialCount.ipv4_aliases += 1;
        this.entityFormService.insertFormArrayGroup(
            this.initialCount.ipv4_aliases, this.ipv4formArray, this.ipv4arrayControl.formarray);
      }
    },
    {
      id : 'remove_ipv4_alias',
      name : T('Remove Additional IPv4 Alias'),
      function : () => {
        this.initialCount.ipv4_aliases -= 1;
        this.entityFormService.removeFormArrayGroup(this.initialCount.ipv4_aliases,
                                                    this.ipv4formArray);
      }
    },
    {
      id : 'add_ipv6_alias',
      name : T('Add Additional IPv6 Alias'),
      function : () => {
        this.initialCount.ipv6_aliases += 1;
        this.entityFormService.insertFormArrayGroup(
          this.initialCount.ipv6_aliases, this.ipv6formArray, this.ipv6arrayControl.formarray);
        }
    },
    {
    id : 'remove_ipv6_alias',
    name : T('Remove Additional IPv6 Alias'),
    function : () => {
      this.initialCount.ipv6_aliases -= 1;
      this.entityFormService.removeFormArrayGroup(this.initialCount.ipv6_aliases,
                                                  this.ipv6formArray);
    }
  }];

  int_warning = T("Please configure the Web UI interface (");
  int_warning_2 = T(") before configuring other interfaces to avoid losing connection to the user interface.");

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected entityFormService: EntityFormService,
              protected networkService: NetworkService, protected dialog: DialogService,
              protected ws: WebSocketService, protected translate: TranslateService) {}

  isCustActionVisible(actionId: string) {
    if (actionId == 'remove_ipv4_alias' && this.initialCount['ipv4_aliases'] <= this.initialCount_default['ipv4_aliases']) {
      return false;
    }
    if (actionId == 'remove_ipv6_alias' && this.initialCount['ipv6_aliases'] <= this.initialCount_default['ipv6_aliases']) {
      return false;
    }
    return true;
  }

  preInit(entityForm: any) {
    this.int_interface = _.find(this.fieldConfig, {'name' : 'int_interface'});
    this.ipv4arrayControl = _.find(this.fieldConfig, {'name' : 'ipv4_aliases'});
    this.ipv6arrayControl = _.find(this.fieldConfig, {'name' : 'ipv6_aliases'});
    this.route.params.subscribe(params => {
      if(!params['pk']) {
        this.int_interface.type = 'select';
        this.int_interface.options = [];
      } else {
        this.confirmSubmit = true;
        this.ipv4arrayControl.initialCount = this.initialCount['ipv4_aliases']
          = this.initialCount_default['ipv4_aliases'] = 0;
        this.ipv6arrayControl.initialCount = this.initialCount['ipv6_aliases']
          = this.initialCount_default['ipv6_aliases'] = 0;

        this.ipv4arrayControl.formarray[2]['isHidden'] = false;
        this.ipv4arrayControl.formarray[2].disabled = false;
        this.ipv6arrayControl.formarray[2]['isHidden'] = false;
        this.ipv6arrayControl.formarray[2].disabled = false;
      }
    });
  }

  afterInit(entityForm: any) {
    this.int_interface_fg = entityForm.formGroup.controls['int_interface'];

    if (entityForm.isNew) {
      this.rest.get(this.resource_name, []).subscribe((res) => {
        if (res.data.length === 0) {
          this.ws.call('interfaces.websocket_interface', []).subscribe((wsint) => {
            if (wsint && wsint.name) {
              this.wsint = wsint.name;
              this.translate.get(this.int_warning).subscribe((int_warning) => {
                this.translate.get(this.int_warning_2).subscribe((int_warning_2) => {
                  this.int_interface_warning = int_warning + wsint.name + int_warning_2;
                });
              });
              this.int_interface_fg_sub = this.int_interface_fg.valueChanges.subscribe((val) => {
                if (val !== this.wsint) {
                  this.int_interface.warnings = this.int_interface_warning;
                } else {
                  this.int_interface.warnings = null;
                }
              });
              this.int_interface_fg.setValue(wsint.name);
              entityForm.formGroup.controls['int_name'].setValue(wsint.name);
            }
          }, (err) => {
            new EntityUtils().handleWSError(entityForm, err);
          });
        }
      });
    }
    this.ipv4formArray = entityForm.formGroup.controls['ipv4_aliases'];
    this.ipv6formArray = entityForm.formGroup.controls['ipv6_aliases'];
    this.int_ipv4address = _.find(this.fieldConfig, {'name': 'int_ipv4address'});
    this.int_ipv6address = _.find(this.fieldConfig, {'name': 'int_ipv6address'});
    this.int_v4netmaskbit =
        _.find(this.fieldConfig, {'name' : 'int_v4netmaskbit'});

    this.int_v6netmaskbit =
        _.find(this.fieldConfig, {'name' : 'int_v6netmaskbit'});

    this.int_dhcp = entityForm.formGroup.controls['int_dhcp'];
    this.int_ipv6auto = entityForm.formGroup.controls['int_ipv6auto'];

    this.int_ipv4address['isHidden'] = this.int_v4netmaskbit['isHidden'] = this.int_dhcp.value;
    this.int_ipv6address['isHidden'] = this.int_v6netmaskbit['isHidden'] = this.int_ipv6auto.value;

    this.int_dhcp_subscription = this.int_dhcp.valueChanges.subscribe((value) => {
      this.int_ipv4address['isHidden'] = this.int_v4netmaskbit['isHidden'] = value;
    });
    this.int_ipv6auto_subscription = this.int_ipv6auto.valueChanges.subscribe((value) => {
      this.int_ipv6address['isHidden'] = this.int_v6netmaskbit['isHidden'] = value;
    });

    if (!entityForm.isNew) {
      entityForm.setDisabled('int_interface', true);
    }
    else {
      this.networkService.getInterfaceNicChoices().subscribe((res) => {
        res.forEach((item) => {
          this.int_interface.options.push({label : item[1], value : item[0]});
        });
      });
    }
  }

  clean(data) {
    let aliases = []
    for (let i = 0; i < data.ipv4_aliases.length; i++) {
      if (!data.ipv4_aliases[i]['delete'] &&
          !!data.ipv4_aliases[i]['alias_address'] &&
          !!data.ipv4_aliases[i]['alias_netmaskbit']) {
        aliases.push(data.ipv4_aliases[i]['alias_address'] + '/'
                     + data.ipv4_aliases[i]['alias_netmaskbit']);
      }
    }
    for (let i = 0; i < data.ipv6_aliases.length; i++) {
      if (!data.ipv6_aliases[i]['delete'] &&
          !!data.ipv6_aliases[i]['alias_address'] &&
          !!data.ipv6_aliases[i]['alias_netmaskbit']) {
        aliases.push(data.ipv6_aliases[i]['alias_address'] + '/'
                     + data.ipv6_aliases[i]['alias_netmaskbit']);
      }
    }
    delete data.ipv4_aliases;
    delete data.ipv6_aliases;
    data.int_aliases = aliases;
    return data;
  }

  preHandler(data: any[]): any[] {
    let aliases = [];
    for (let i = 0; i < data.length; i++) {
      let alias = data[i].split('/');
      if (alias.length === 2) {
        aliases.push({alias_address:alias[0], alias_netmaskbit:alias[1]});
      }
    }
    return aliases;
  }

  resourceTransformIncomingRestData(data) {
    const ipv4_aliases = [];
    const ipv6_aliases = [];
    const aliases = data['int_aliases'];
    for (let i = 0; i < aliases.length; i++) {
      if (aliases[i].indexOf(':') === -1) {
        ipv4_aliases.push(aliases[i]);
      } else {
        ipv6_aliases.push(aliases[i]);
      }
    }
    data['ipv4_aliases'] = ipv4_aliases;
    data['ipv6_aliases'] = ipv6_aliases;
    return data;
  }

  ngOnDestroy() {
    this.int_dhcp_subscription.unsubscribe();
    this.int_ipv6auto_subscription.unsubscribe();
    if (this.int_interface_fg_sub) {
      this.int_interface_fg_sub.unsubscribe();
    }
  }
}
