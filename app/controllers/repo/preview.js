import Controller from '@ember/controller';
import { fetch, Headers } from 'fetch';
import { task } from 'ember-concurrency';
import EmberObject, { get } from '@ember/object';
import { service } from 'ember-decorators/service';
import config from 'travis/config/environment';

export default Controller.extend({
  @service store: null,

  selected: null,

  fetch: task(function* () {
    // FIXME obvs
    let url = new URL(`${config.previewEndpoint}/` +
      `requests/${this.get('selected.id')}`);
    let headers = {
      'Accept': 'application/json'
    };

    if (this.get('eventType')) {
      url.searchParams.append('event_type', this.get('eventType'));
    }

    if (this.get('commitMessage')) {
      url.searchParams.append('commit_message', this.get('commitMessage'));
    }

    if (this.get('yaml')) {
      url.searchParams.append('yml', this.get('yaml'));
    }

    let response = yield fetch(url, {
      headers: new Headers(headers)
    });

    let json = yield response.json();

    let yaml = get(json, 'request.yaml_config.yaml');

    if (yaml) {
      if (!this.get('yaml')) {
        this.set('yaml', yaml);
      }

      let jobs;

      if (json.stages && json.stages.length) {
        jobs = json.stages.reduce((jobs, stage) => jobs.concat(stage.jobs.map(jobJson => {
          let job = EmberObject.create(jobJson);
          job.set('stage', {id: stage.number});
          job.set('config', {content: JSON.parse(jobJson.config)});
          return job;
        })), []);
      } else {
        jobs = json.jobs.reduce((jobs, jobJson) => {
          let job = EmberObject.create(jobJson);
          job.set('config', {content: JSON.parse(jobJson.config)});
          jobs.push(job);
          return jobs;
        }, []);
      }

      let build = EmberObject.create({
        jobs,
        request: json.request
      });
      this.set('build', build);
      this.set('eventType', json.event_type);
      this.set('commitMessage', get(json, 'commit.message'));

      this.set('stages', json.stages.map(stageJson => {
        let stage = this.get('store').createRecord('stage', stageJson);
        stage.set('id', stage.number);
        return stage;
      }));
    } else {
      this.set('yaml', 'error?');
    }
  }),

  actions: {
    chooseRequest(request) {
      this.set('selected', request);

      this.set('yaml', undefined);
      this.get('fetch').perform();
    },
  }
});
