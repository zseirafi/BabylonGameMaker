'use client';

import BabylonSceneViewer from '../babylon/system/babylon';
import { ReactRouterNavAdapter } from "./adpter";

export default function PlayRoute() {
  return (
    <ReactRouterNavAdapter>
      <BabylonSceneViewer
        fullPage={true}
        allowQueryParams={true}
        enableCustomOverlay={false}
      />
    </ReactRouterNavAdapter>
  );
}
