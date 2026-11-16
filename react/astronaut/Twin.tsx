/**
 * Twin.tsx · The astronaut twin: the whole centre of the Overview stage. No "use client" of its own;
 * it renders wherever its parent does, and its live parts (Figure, ScanSweep) are client components.
 *
 *   <Twin art={TWIN_ART} metrics={…} focus="hr" pinned={false} motion="full" spin={false} scan={0} />
 *
 * Same contract and markup as the vanilla createTwin(root) in src/tesai/js/twin/twin.js, so the dashboard's
 * stylesheet (src/tesai/styles/components/twin.css) styles both. Back to front: plate, 360° box, figure, scan.
 */
import { Plate } from './Plate';
import { Figure } from './Figure';
import { ScanSweep } from './ScanSweep';
import { NO_READING, readoutOf } from './model/heart';
import type { TwinProps } from './types';

export function Twin({ art, metrics, focus = null, pinned = false, motion = 'full', spin = false, scan = 0, onScanEnd }: TwinProps) {
  return (
    <div className="twin" data-spinning={spin ? '' : undefined} aria-hidden="true">
      <Plate readout={readoutOf(metrics.hr ?? NO_READING)} />
      <div className="twin-persp">
        <div className={spin ? 'twin-spin on' : 'twin-spin'}>
          <div className="twin-host">
            <Figure art={art} metrics={metrics} focus={focus} pinned={pinned} motion={motion} />
          </div>
        </div>
      </div>
      <ScanSweep run={scan} onEnd={onScanEnd} />
    </div>
  );
}
