import {
  ApplicationRef,
  Component,
  Injector,
  Input,
  QueryList,
  ViewChildren
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import * as _ from 'lodash';
import { Subscription } from 'rxjs/Rx';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

import { RestService, WebSocketService } from '../../../../services/';
import { EntityUtils } from '../../../common/entity/utils';
import { T } from '../../../../translate-marker';
import { DialogService } from 'app/services/dialog.service';

@Component({
  selector: 'vmware-snapshot-form',
  template: `<entity-form [conf]="this"></entity-form>`
})

export class VMwareSnapshotFormComponent {

  protected resource_name: string = 'storage/vmwareplugin';
  protected route_success: string[] = ['storage', 'vmware-Snapshots'];
  protected isEntity: boolean = true;
  protected pk: any;
  public formGroup: FormGroup;

  protected entityForm: any;
  private datastore: any;

  protected fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'hostname',
      placeholder: T('Hostname'),
      tooltip: T('Enter the IP address or hostname of the VMware host.\
                  When clustering, this is the vCenter server for the\
                  cluster.'),
      validation: [Validators.required],
      required: true
    },
    {
      type: 'input',
      name: 'username',
      placeholder: T('Username'),
      tooltip: T('Enter the user on the VMware host with permission to\
                  snapshot virtual machines.'),
      validation: [Validators.required],
      required: true
    },
    {
      type: 'input',
      name: 'password',
      placeholder: T('Password'),
      tooltip: T('Enter the password associated with <b>Username</b>.'),
      inputType: 'password',
      validation: [Validators.required],
      required: true
    },
    {
      type: 'explorer',
      name: 'filesystem',
      placeholder: T('ZFS Filesystem'),
      tooltip: T('Enter the filesystem to snapshot.'),
      explorerType: "zvol",
      initial: '/mnt',
      validation: [Validators.required],
      required: true
    },
    {
      type: 'select',
      name: 'datastore',
      placeholder: T('Datastore'),
      tooltip: T('After entering the <b>Hostname, Username</b>, and\
                  <b>Password</b>, click <b>Fetch Datastores</b> and\
                  select the datastore to be synchronized.'),
      validation: [Validators.required],
      required: true
    },

  ]
  public custActions: Array<any> = [
    {
      id: 'FetchDataStores',
      name: 'Fetch DataStores',
      function: () => {
        this.datastore = _.find(this.fieldConfig, { 'name': 'datastore' });
        this.datastore.type = 'select';
        this.datastore.options = [];

        if (
          this.entityForm.formGroup.controls['hostname'].value === undefined ||
          this.entityForm.formGroup.controls['username'].value === undefined ||
          this.entityForm.formGroup.controls['password'].value === undefined
        ) { this.dialogService.Info(T('VM Snapshot'), T("Please enter valid vmware ESXI/vsphere credentials to fetch datastores.")) }
        else {
          const payload = {};
          payload['hostname'] = this.entityForm.formGroup.controls['hostname'].value;
          payload['username'] = this.entityForm.formGroup.controls['username'].value;
          payload['password'] = this.entityForm.formGroup.controls['password'].value;
          this.ws.call("vmware.get_datastores", [payload]).subscribe((res) => {
            for (const key in res) {
              const datastores = res[key]
              for (const datastore in datastores) {
                this.datastore.options.push({ label: datastore, value: datastore })
              }
            }
          });
        }

      }
    },
  ];

  resourceTransformIncomingRestData(data: any): any {
    data.password = '';
    data.filesystem = '/mnt/' + data.filesystem;
    return data;
  };

  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef, protected dialogService: DialogService) { }



  afterInit(entityForm: any) {
    this.entityForm = entityForm;
  }

  beforeSubmit(entityForm: any) {
    if (entityForm.filesystem !== undefined) {
      entityForm.filesystem = entityForm.filesystem.slice(5);
    }
  }
}
