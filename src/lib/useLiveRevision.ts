import { useEffect, useState } from 'react';
import { subscribeLiveUpdates, type LiveTopic } from './liveUpdates';

export function useLiveRevision(topic: LiveTopic) {
  const [revision, setRevision] = useState(0);
  useEffect(() => subscribeLiveUpdates(topics => {
    if (topics.includes(topic)) setRevision(value => value + 1);
  }), [topic]);
  return revision;
}
