import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #10b981 0%, #0ea5a4 55%, #6366f1 100%)',
        }}
      >
        <div
          style={{
            width: 132,
            height: 132,
            borderRadius: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15,23,42,0.32)',
            border: '3px solid rgba(241,245,249,0.85)',
          }}
        >
          <div
            style={{
              width: 14,
              height: 64,
              borderRadius: 7,
              background: 'linear-gradient(180deg, #e2e8f0 0%, #94a3b8 100%)',
              position: 'relative',
              display: 'flex',
            }}
          >
            <div
              style={{
                position: 'absolute',
                bottom: -16,
                left: -16,
                width: 46,
                height: 10,
                borderRadius: 5,
                background: '#f1f5f9',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: -22,
                left: -7,
                width: 28,
                height: 20,
                borderRadius: 6,
                background: '#f1f5f9',
              }}
            />
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
