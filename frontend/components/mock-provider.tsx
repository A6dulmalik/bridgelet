'use client';

import { useEffect } from 'react';

export function MockProvider() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      import('@/mocks').then(({ initMocks }) => initMocks());
    }
  }, []);

  return null;
}
