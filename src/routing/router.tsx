'use client';

import BabylonSceneViewer from '../babylon/system/babylon';

export default function PlayRoute() {
  return (
      <BabylonSceneViewer
        fullPage={true}
        allowQueryParams={true}
        enableCustomOverlay={false}
      />
  );
}
