import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL;
const WRITE_KEY = __ENV.WRITE_KEY;

const RATE = Number(__ENV.RATE || 2);
const DURATION = __ENV.DURATION || '1m';
const RUN_ID = __ENV.RUN_ID || `${Date.now()}`;

export const options = {
  scenarios: {
    track_load: {
      executor: 'constant-arrival-rate',
      rate: RATE,
      timeUnit: '1s',
      duration: DURATION,
      preAllocatedVUs: 10,
      maxVUs: 100,
      tags: {
        endpoint: 'track',
        test_type: 'smoke',
      },
    },
  },

  thresholds: {
    'http_req_failed': ['rate<0.001'],
    'http_req_duration{endpoint:track}': [
      'p(95)<150',
      'p(99)<500',
    ],
    'dropped_iterations': ['count==0'],
    'checks': ['rate>0.999'],
  },
};

export default function () {
  const userId = `test-${1000 + (__ITER % 100)}`;

  const body = {
    type: 'track',
    event: __ITER % 12 === 0
      ? 'Transaction_Declined'
      : 'Transaction_Approved',
    userId,
    messageId: `${RUN_ID}-${__VU}-${__ITER}`,
    timestamp: new Date().toISOString(),
    properties: {
      response_code: __ITER % 12 === 0 ? '116' : '000',
      mcc_code: ['5411', '5499', '5812', '5541'][__ITER % 4],
      tran_amount: 50 + (__ITER % 5000),
    },
  };

  const res = http.post(
    `${BASE_URL}/api/public/apps/track`,
    JSON.stringify(body),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: WRITE_KEY,
      },
      tags: {
        endpoint: 'track',
      },
    }
  );

  check(res, {
    'status is 2xx': (r) => r.status >= 200 && r.status < 300,
  });
}
