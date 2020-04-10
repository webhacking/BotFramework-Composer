// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License

import { copySendActivity } from '../../src/copyUtils/copySendActivity';
import { ExternalApi } from '../../src/copyUtils/ExternalApi';
import { externalApiStub as externalApi } from '../jestMocks/externalApiStub';

describe('copySendActivity', () => {
  const externalApiWithLgCopy: ExternalApi = {
    ...externalApi,
    transformLgField: (id, data, fieldName, fieldValue) => Promise.resolve(fieldValue + '(copy)'),
  };

  it('can copy SendActivity', async () => {
    const sendActivity = {
      $kind: 'Microsoft.SendActivity',
      activity: '[bfdactivity_1234]',
    };

    expect(await copySendActivity(sendActivity, externalApiWithLgCopy)).toEqual({
      $kind: 'Microsoft.SendActivity',
      $designer: { id: '5678' },
      activity: '[bfdactivity_1234](copy)',
    });
  });
});
