import { Component } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';

import { RestService } from '../../../../services';
import { TaskService } from '../../../../services/';


@Component({
  selector: 'app-scrub-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
  providers: [TaskService]
})
export class ScrubListComponent {

  public title = "Scrub Tasks";
  protected resource_name = 'storage/scrub';
  protected route_add: string[] = ['tasks', 'scrub', 'add'];
  protected route_add_tooltip = "Add Scrub Task";
  protected route_edit: string[] = ['tasks', 'scrub', 'edit'];
  protected entityList: any;

  public columns: Array < any > = [
    { name: 'Pool', prop: 'scrub_volume' },
    { name: 'Threshold days', prop: 'scrub_threshold' },
    { name: 'Description', prop: 'scrub_description' },
    { name: 'Minute', prop: 'scrub_minute' },
    { name: 'Hour', prop: 'scrub_hour' },
    { name: 'Day of Month', prop: 'scrub_daymonth' },
    { name: 'Month', prop: 'scrub_month' },
    { name: 'Day of Week', prop: 'scrub_dayweek' },
    { name: 'Enabled', prop: 'scrub_enabled' },
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
  };

  constructor(protected router: Router,
    protected rest: RestService,
    protected taskService: TaskService) {}

  dataHandler(entityList: any) {

    let timeout = setTimeout(() => {
      this.initFields(entityList);
      clearTimeout(timeout);
    }, 100);
  }

  initFields(entityList: any) {
    for (let i = 0; i < entityList.rows.length; i++) {
      let month_list: Array < string > = [];
      let months = entityList.rows[i].scrub_month.split(',');

      if (_.isEqual(entityList.rows[i].scrub_month, "*")) {
        entityList.rows[i].scrub_month = "Every month";
      } else {
        this.taskService.getMonthChoices().subscribe((res) => {
          for (let i = 0; i < months.length; i++) {
            month_list.push(res[Number(months[i]) - 1][1]);
          }
          entityList.rows[i].scrub_month = _.join(month_list, ', ');
        });
      }

      let dayweeks_list: Array < string > = [];
      let dayweeks = entityList.rows[i].scrub_dayweek.split(',');

      if (_.isEqual(entityList.rows[i].scrub_dayweek, "*")) {
        entityList.rows[i].scrub_dayweek = "Every day";
      } else {
        this.taskService.getWeekdayChoices().subscribe((res) => {
          for (let i = 0; i < dayweeks.length; i++) {
            dayweeks_list.push(res[Number(dayweeks[i]) - 1][1]);
          }
          entityList.rows[i].scrub_dayweek = _.join(dayweeks_list, ', ');
        });
      }

      if (_.startsWith(entityList.rows[i].scrub_daymonth, '*/')) {
        let N = Number(_.trim(entityList.rows[i].scrub_daymonth, '*/'));
        entityList.rows[i].scrub_daymonth = "Every " + N + " days";
      } else if (_.isEqual(entityList.rows[i].scrub_daymonth, "*")) {
        entityList.rows[i].scrub_daymonth = "Every day";
      }

      if (_.startsWith(entityList.rows[i].scrub_minute, '*/')) {
        let N = Number(_.trim(entityList.rows[i].scrub_minute, '*/'));
        entityList.rows[i].scrub_minute = "Every " + N + " minutes";
      } else if (_.isEqual(entityList.rows[i].scrub_minute, "*")) {
        entityList.rows[i].scrub_minute = "Every minute";
      }

      if (_.startsWith(entityList.rows[i].scrub_hour, '*/')) {
        let N = Number(_.trim(entityList.rows[i].scrub_hour, '*/'));
        entityList.rows[i].scrub_hour = "Every " + N + " hours";
      } else if (_.isEqual(entityList.rows[i].scrub_hour, "*")) {
        entityList.rows[i].scrub_hour = "Every hour";
      }
    }
  }
}
