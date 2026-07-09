import { ImageResponse } from 'next/og';

export const alt = '燕云十六声装备毕业率管理器';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          padding: 80,
          background: 'linear-gradient(135deg, #0f172a 0%, #134e4a 55%, #1e1b4b 100%)',
          color: '#f1f5f9',
          fontFamily: 'sans-serif',
        }}
      >
        {/* left emblem */}
        <div
          style={{
            width: 260,
            height: 260,
            borderRadius: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #10b981 0%, #0ea5a4 55%, #6366f1 100%)',
            marginRight: 64,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 170,
              height: 170,
              borderRadius: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(15,23,42,0.32)',
              border: '4px solid rgba(241,245,249,0.85)',
            }}
          >
            <div
              style={{
                width: 20,
                height: 86,
                borderRadius: 10,
                background: 'linear-gradient(180deg, #e2e8f0 0%, #94a3b8 100%)',
                position: 'relative',
                display: 'flex',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  bottom: -22,
                  left: -22,
                  width: 64,
                  height: 14,
                  borderRadius: 7,
                  background: '#f1f5f9',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: -30,
                  left: -10,
                  width: 40,
                  height: 28,
                  borderRadius: 8,
                  background: '#f1f5f9',
                }}
              />
            </div>
          </div>
        </div>

        {/* right text */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 30, color: '#5eead4', letterSpacing: 2, marginBottom: 12 }}>
            WHERE WINDS MEET · YANYUN
          </div>
          <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.1, marginBottom: 20 }}>
            Gear Graduation
            <br />
            Calculator
          </div>
          <div style={{ fontSize: 30, color: '#cbd5e1', marginBottom: 28 }}>
            DPS Simulation · Graduation Rate · Retune &amp; Legacy
          </div>
          <div
            style={{
              fontSize: 26,
              color: '#94a3b8',
              padding: '10px 22px',
              border: '2px solid rgba(148,163,184,0.4)',
              borderRadius: 999,
              alignSelf: 'flex-start',
            }}
          >
            yysls.simmoc.cn
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
