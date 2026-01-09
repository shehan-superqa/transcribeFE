import { Box } from '@mui/material';
import { useTheme } from '../../../contexts/ThemeContext';
import '../../../css/components/SkeletonLoading.css';

export default function SkeletonLoadingScreen() {
  const { theme } = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <>
      {/* Loading Bar */}
      <Box
        sx={{
          position: 'fixed',
          top: '64px',
          left: 0,
          right: 0,
          zIndex: 50,
        }}
      >
        <div className="loading-bar" />
      </Box>

      {/* Main Content Skeleton */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: { xs: 3, lg: 4 },
          position: 'relative',
          bgcolor: isDark ? 'rgba(17, 24, 39, 0.5)' : 'rgba(249, 250, 251, 0.5)',
        }}
      >
        {/* Spinner Overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 40,
            pointerEvents: 'none',
          }}
        >
          <Box
            sx={{
              p: 2,
              bgcolor: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(8px)',
              borderRadius: '50%',
            }}
          >
            <svg
              className="animate-spin-slow"
              style={{
                height: '40px',
                width: '40px',
                color: '#7c3aed',
              }}
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                fill="currentColor"
              />
            </svg>
          </Box>
        </Box>

        {/* Header Skeleton */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'flex-end' },
            justifyContent: 'space-between',
            mb: 5,
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box
              className="shimmer"
              sx={{
                height: '32px',
                width: '256px',
                bgcolor: isDark ? '#374151' : '#E5E7EB',
                borderRadius: '6px',
              }}
            />
            <Box
              className="shimmer"
              sx={{
                height: '16px',
                width: '384px',
                bgcolor: isDark ? '#1F2937' : '#F3F4F6',
                borderRadius: '6px',
              }}
            />
          </Box>
          <Box
            className="shimmer"
            sx={{
              height: '44px',
              width: '176px',
              bgcolor: isDark ? 'rgba(124, 58, 237, 0.1)' : 'rgba(124, 58, 237, 0.2)',
              borderRadius: '8px',
            }}
          />
        </Box>

        {/* Content Grid */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 4 }}>
          {/* Main Content */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Summary Cards */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 3,
              }}
            >
              {[1, 2, 3].map((i) => (
                <Box
                  key={i}
                  sx={{
                    bgcolor: isDark ? '#111827' : '#ffffff',
                    p: 3,
                    borderRadius: '16px',
                    border: `1px solid ${isDark ? '#1F2937' : '#F3F4F6'}`,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <Box
                      className="shimmer"
                      sx={{
                        height: '12px',
                        width: '96px',
                        bgcolor: isDark ? '#1F2937' : '#F3F4F6',
                        borderRadius: '4px',
                      }}
                    />
                    <Box
                      sx={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        bgcolor:
                          i === 1
                            ? isDark
                              ? 'rgba(16, 185, 129, 0.2)'
                              : '#ECFDF5'
                            : i === 2
                              ? isDark
                                ? 'rgba(239, 68, 68, 0.2)'
                                : '#FEF2F2'
                              : isDark
                                ? 'rgba(124, 58, 237, 0.2)'
                                : '#F3E8FF',
                      }}
                    />
                  </Box>
                  <Box
                    className="shimmer"
                    sx={{
                      height: '32px',
                      width: '128px',
                      bgcolor: isDark ? '#374151' : '#E5E7EB',
                      borderRadius: '6px',
                      mb: 2,
                    }}
                  />
                  <Box
                    className="shimmer"
                    sx={{
                      height: '12px',
                      width: '80px',
                      bgcolor: isDark ? '#1F2937' : '#F3F4F6',
                      borderRadius: '4px',
                    }}
                  />
                </Box>
              ))}
            </Box>

            {/* Section Header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box
                className="shimmer"
                sx={{
                  height: '24px',
                  width: '192px',
                  bgcolor: isDark ? '#374151' : '#E5E7EB',
                  borderRadius: '6px',
                }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Box
                  className="shimmer"
                  sx={{
                    width: '32px',
                    height: '32px',
                    bgcolor: isDark ? '#1F2937' : '#F3F4F6',
                    borderRadius: '4px',
                  }}
                />
                <Box
                  className="shimmer"
                  sx={{
                    width: '32px',
                    height: '32px',
                    bgcolor: isDark ? '#1F2937' : '#F3F4F6',
                    borderRadius: '4px',
                  }}
                />
              </Box>
            </Box>

            {/* Content Cards */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: 3,
              }}
            >
              {[1, 2, 3].map((i) => (
                <Box
                  key={i}
                  sx={{
                    bgcolor: isDark ? '#111827' : '#ffffff',
                    p: 3,
                    borderRadius: '16px',
                    border: `1px solid ${isDark ? '#1F2937' : '#F3F4F6'}`,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 4,
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box
                        className="shimmer"
                        sx={{
                          height: '20px',
                          width: '128px',
                          bgcolor: isDark ? '#374151' : '#E5E7EB',
                          borderRadius: '4px',
                        }}
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Box
                          className="shimmer"
                          sx={{
                            height: '12px',
                            width: '48px',
                            bgcolor: isDark ? '#1F2937' : '#F3F4F6',
                            borderRadius: '4px',
                          }}
                        />
                        <Box
                          className="shimmer"
                          sx={{
                            height: '12px',
                            width: '48px',
                            bgcolor: isDark ? '#1F2937' : '#F3F4F6',
                            borderRadius: '4px',
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box
                        className="shimmer"
                        sx={{
                          height: '28px',
                          width: '112px',
                          bgcolor: isDark ? '#374151' : '#E5E7EB',
                          borderRadius: '6px',
                        }}
                      />
                      <Box
                        className="shimmer"
                        sx={{
                          height: '12px',
                          width: '96px',
                          bgcolor: isDark ? '#1F2937' : '#F3F4F6',
                          borderRadius: '4px',
                        }}
                      />
                    </Box>
                    <Box
                      className="shimmer"
                      sx={{
                        width: '48px',
                        height: '24px',
                        bgcolor: isDark ? '#1F2937' : '#F3F4F6',
                        borderRadius: '9999px',
                      }}
                    />
                  </Box>
                </Box>
              ))}
              {/* Add New Card */}
              <Box
                sx={{
                  border: `2px dashed ${isDark ? '#475569' : '#CBD5E1'}`,
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '168px',
                  bgcolor: 'transparent',
                }}
              >
                <Box
                  className="shimmer"
                  sx={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    bgcolor: isDark ? '#1F2937' : '#F3F4F6',
                  }}
                />
              </Box>
            </Box>
          </Box>

          {/* Sidebar */}
          <Box sx={{ width: { xs: '100%', lg: '320px' }, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Stats Card */}
            <Box
              sx={{
                bgcolor: isDark ? '#111827' : '#ffffff',
                p: 3,
                borderRadius: '16px',
                border: `1px solid ${isDark ? '#1F2937' : '#F3F4F6'}`,
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              }}
            >
              <Box
                className="shimmer"
                sx={{
                  height: '20px',
                  width: '128px',
                  bgcolor: isDark ? '#374151' : '#E5E7EB',
                  borderRadius: '4px',
                  mb: 3,
                }}
              />
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 2,
                }}
              >
                {[1, 2, 3, 4].map((i) => (
                  <Box key={i} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box
                      className="shimmer"
                      sx={{
                        height: '8px',
                        width: '40px',
                        bgcolor: isDark ? '#1F2937' : '#F3F4F6',
                        borderRadius: '4px',
                      }}
                    />
                    <Box
                      className="shimmer"
                      sx={{
                        height: '16px',
                        width: '64px',
                        bgcolor: isDark ? '#374151' : '#E5E7EB',
                        borderRadius: '4px',
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Actions Card */}
            <Box
              sx={{
                bgcolor: isDark ? '#111827' : '#ffffff',
                p: 3,
                borderRadius: '16px',
                border: `1px solid ${isDark ? '#1F2937' : '#F3F4F6'}`,
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <Box
                className="shimmer"
                sx={{
                  height: '20px',
                  width: '112px',
                  bgcolor: isDark ? '#374151' : '#E5E7EB',
                  borderRadius: '4px',
                  mb: 1,
                }}
              />
              <Box
                className="shimmer"
                sx={{
                  height: '40px',
                  width: '100%',
                  bgcolor: isDark ? 'rgba(124, 58, 237, 0.1)' : 'rgba(124, 58, 237, 0.2)',
                  borderRadius: '8px',
                }}
              />
              <Box
                className="shimmer"
                sx={{
                  height: '40px',
                  width: '100%',
                  bgcolor: isDark ? '#1F2937' : '#F9FAFB',
                  borderRadius: '8px',
                  border: `1px solid ${isDark ? '#374151' : '#F3F4F6'}`,
                }}
              />
              <Box
                className="shimmer"
                sx={{
                  height: '40px',
                  width: '100%',
                  bgcolor: isDark ? '#1F2937' : '#F9FAFB',
                  borderRadius: '8px',
                  border: `1px solid ${isDark ? '#374151' : '#F3F4F6'}`,
                }}
              />
            </Box>

            {/* Notifications Card */}
            <Box
              sx={{
                bgcolor: isDark ? '#111827' : '#ffffff',
                p: 3,
                borderRadius: '16px',
                border: `1px solid ${isDark ? '#1F2937' : '#F3F4F6'}`,
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 3,
                }}
              >
                <Box
                  className="shimmer"
                  sx={{
                    height: '20px',
                    width: '112px',
                    bgcolor: isDark ? '#374151' : '#E5E7EB',
                    borderRadius: '4px',
                  }}
                />
                <Box
                  className="shimmer"
                  sx={{
                    height: '16px',
                    width: '48px',
                    bgcolor: isDark ? '#1F2937' : '#F3F4F6',
                    borderRadius: '4px',
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {[1, 2].map((i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        bgcolor: '#EF4444',
                      }}
                    />
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box
                        className="shimmer"
                        sx={{
                          height: '12px',
                          width: '128px',
                          bgcolor: isDark ? '#374151' : '#E5E7EB',
                          borderRadius: '4px',
                        }}
                      />
                      <Box
                        className="shimmer"
                        sx={{
                          height: '8px',
                          width: '80px',
                          bgcolor: isDark ? '#1F2937' : '#F3F4F6',
                          borderRadius: '4px',
                        }}
                      />
                    </Box>
                    <Box
                      className="shimmer"
                      sx={{
                        height: '12px',
                        width: '64px',
                        bgcolor: isDark ? '#1F2937' : '#F3F4F6',
                        borderRadius: '4px',
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
}

