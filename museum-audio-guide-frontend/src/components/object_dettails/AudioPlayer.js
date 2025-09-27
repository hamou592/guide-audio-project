import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  IconButton,
  Slider,
  Stack,
  Typography,
  styled
} from '@mui/material';

import VolumeDown from '@mui/icons-material/VolumeDown';
import VolumeUp from '@mui/icons-material/VolumeUp';
import VolumeOff from '@mui/icons-material/VolumeOff';
import VolumeMute from '@mui/icons-material/VolumeMute';
import Pause from '@mui/icons-material/Pause';
import PlayArrow from '@mui/icons-material/PlayArrow';
import FastRewind from '@mui/icons-material/FastRewind';
import FastForward from '@mui/icons-material/FastForward';

// --- Styled Components ---
const RootContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  backgroundColor: 'var(--museum-blue)',
  color: 'var(--museum-gold)',
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  margin: 0,
}));

const InnerContent = styled(Box)(({ theme }) => ({
  paddingLeft: theme.spacing(3),
  paddingRight: theme.spacing(3),
  width: '100%',
  boxSizing: 'border-box',
}));

const ControlSlider = styled(Slider)(() => ({
  color: 'var(--museum-gold)',
  height: 4,
  '& .MuiSlider-thumb': {
    width: 12,
    height: 12,
  },
}));

// --- AudioPlayer Component ---
const AudioPlayer = ({ src }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(30);
  const [isMuted, setIsMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = isMuted ? 0 : volume / 100;

    const updateTime = () => {
      setElapsed(Math.floor(audio.currentTime));
      setDuration(Math.floor(audio.duration || 0));
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateTime);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateTime);
    };
  }, [volume, isMuted]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const skipForward = () => {
    if (audioRef.current) audioRef.current.currentTime += 5;
  };

  const skipBackward = () => {
    if (audioRef.current) audioRef.current.currentTime -= 5;
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '00:00';
    const mins = Math.floor(time / 60).toString().padStart(2, '0');
    const secs = Math.floor(time % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const renderVolumeIcon = () => {
    if (isMuted) return <VolumeOff sx={{ color: 'var(--museum-gold)' }} />;
    if (volume === 0) return <VolumeMute sx={{ color: 'var(--museum-gold)' }} />;
    if (volume < 50) return <VolumeDown sx={{ color: 'var(--museum-gold)' }} />;
    return <VolumeUp sx={{ color: 'var(--museum-gold)' }} />;
  };

  return (
    <RootContainer>
      <InnerContent>
        <audio ref={audioRef} src={src} preload="metadata" muted={isMuted} />

        {/* Controls */}
        <Stack direction="row" spacing={2} justifyContent="center" alignItems="center" pb={1}>
          <IconButton onClick={skipBackward}>
            <FastRewind sx={{ color: 'var(--museum-gold)' }} />
          </IconButton>
          <IconButton onClick={togglePlay}>
            {isPlaying ? (
              <Pause sx={{ color: 'var(--museum-gold)' }} />
            ) : (
              <PlayArrow sx={{ color: 'var(--museum-gold)' }} />
            )}
          </IconButton>
          <IconButton onClick={skipForward}>
            <FastForward sx={{ color: 'var(--museum-gold)' }} />
          </IconButton>
        </Stack>

        {/* Seek Bar */}
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="caption" sx={{ color: 'var(--museum-gold)', minWidth: 40 }}>
            {formatTime(elapsed)}
          </Typography>
          <ControlSlider
            min={0}
            max={duration}
            value={elapsed}
            onChange={(e, v) => {
              audioRef.current.currentTime = v;
              setElapsed(v);
            }}
          />
          <Typography variant="caption" sx={{ color: 'var(--museum-gold)', minWidth: 40 }}>
            {formatTime(duration - elapsed)}
          </Typography>
        </Stack>

        {/* Volume */}
        <Stack direction="row" alignItems="center" spacing={2} pt={1}>
          <IconButton onClick={() => setIsMuted(!isMuted)}>
            {renderVolumeIcon()}
          </IconButton>
          <ControlSlider
            min={0}
            max={100}
            value={volume}
            onChange={(e, v) => {
              setVolume(v);
              if (isMuted && v > 0) setIsMuted(false);
            }}
          />
        </Stack>
      </InnerContent>
    </RootContainer>
  );
};

export default AudioPlayer;
