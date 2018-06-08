import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';

import { RestService, WebSocketService } from '../../../services';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { EntityUtils } from '../../common/entity/utils';
import { T } from '../../../translate-marker';

@Component({
  selector: 'app-plugins-installed-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class PluginsInstalledListComponent {

  public title = "Installed Plugins";
  protected queryCall = 'jail.list_resource';
  protected queryCallOption = ["PLUGIN"];
  protected wsDelete = 'jail.do_delete';
  protected wsMultiDelete = 'core.bulk';
  protected entityList: any;

  public columns: Array < any > = [
    { name: T('Name'), prop: '1' },
    { name: T('Boot'), prop: '2' },
    { name: T('State'), prop: '3' },
    // { name: 'Type', prop: '4' },
    { name: T('Release'), prop: '5' },
    { name: T('IP4 address'), prop: '6' },
    { name: T('IP6 address'), prop: '7' },
    { name: T('Template'), prop: '8' }
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    multiSelect: true,
  };
  public multiActions: Array < any > = [{
      id: "mstart",
      label: T("Start"),
      enable: true,
      onClick: (selected) => {
        let selectedJails = this.getSelectedNames(selected);
        this.loader.open();
        this.entityList.busy =
          this.ws.job('core.bulk', ["jail.start", selectedJails]).subscribe(
            (res) => {
              for (let i in selected) {
                selected[i][3] = 'up';
              }
              this.updateMultiAction(selected);
              this.loader.close();
            },
            (res) => {
              new EntityUtils().handleError(this, res);
              this.loader.close();
            });
      }
    },
    {
      id: "mstop",
      label: T("Stop"),
      enable: true,
      onClick: (selected) => {
        let selectedJails = this.getSelectedNames(selected);
        this.loader.open();
        this.entityList.busy =
          this.ws.job('core.bulk', ["jail.stop", selectedJails]).subscribe(
            (res) => {
              for (let i in selected) {
                selected[i][3] = 'down';
              }
              this.updateMultiAction(selected);
              this.loader.close();
            },
            (res) => {
              new EntityUtils().handleError(this, res);
              this.loader.close();
            });
      }
    },
    {
      id: "mdelete",
      label: T("Delete"),
      enable: true,
      onClick: (selected) => {
        this.entityList.doMultiDelete(selected);
      }
    },
  ];
  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService, protected loader: AppLoaderService) {}

  afterInit(entityList: any) { this.entityList = entityList; }

  isActionVisible(actionId: string, row: any) {
    if (actionId === 'start' && row[3] === "up") {
      return false;
    } else if (actionId === 'stop' && row[3] === "down") {
      return false;
    } else if (actionId === 'management' && row[3] === "down") {
      return false;
    }
    return true;
  }

  getActions(parentRow) {
    return [{
        id: "start",
        label: T("Start"),
        onClick: (row) => {
          this.entityList.busy =
            this.ws.call('jail.start', [row[1]]).subscribe(
              (res) => { row[3] = 'up'; },
              (res) => {
                new EntityUtils().handleError(this, res);
              });
        }
      },
      {
        id: "stop",
        label: T("Stop"),
        onClick: (row) => {
          this.entityList.busy =
            this.ws.call('jail.stop', [row[1]]).subscribe(
              (res) => { row[3] = 'down'; },
              (res) => {
                new EntityUtils().handleError(this, res);
              });
        }
      },
      {
        id: "management",
        label: T("Management"),
        onClick: (row) => {
          window.open(row[9]);
        }
      },
      {
        id: "delete",
        label: T("Delete"),
        onClick: (row) => {
          this.entityList.doDelete(row[1]);
        }
      }
    ]
  }

  getSelectedNames(selectedJails) {
    let selected: any = [];
    for (let i in selectedJails) {
      selected.push([selectedJails[i][1]]);
    }
    return selected;
  }

  updateMultiAction(selected: any) {
    if (_.find(selected, ['3', 'up'])) {
     _.find(this.multiActions, {'id': 'mstop'})['enable'] = true;
    } else {
      _.find(this.multiActions, {'id': 'mstop'})['enable'] = false;
    }

    if (_.find(selected, ['3', 'down'])) {
     _.find(this.multiActions, {'id': 'mstart'})['enable'] = true;
    } else {
      _.find(this.multiActions, {'id': 'mstart'})['enable'] = false;
    }
  }

  wsMultiDeleteParams(selected: any) {
    let params: Array<any> = ['jail.do_delete'];
    params.push(this.getSelectedNames(selected));
    return params;
  }

  dataHandler(entityList: any) {
    for (let i = 0; i < entityList.rows.length; i++) {
      if (_.split(entityList.rows[i][6], '|').length > 1) {
        entityList.rows[i][6] = _.split(entityList.rows[i][6], '|')[1];
      }
    }
  }
}
