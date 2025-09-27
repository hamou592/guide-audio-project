import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ObjectDetails.css';
import api from '../../api';
import { useTicket } from '../../context/TicketContext';

import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Slide,
  Collapse,
  styled, useMediaQuery, useTheme
} from '@mui/material';
import AudioPlayer from './AudioPlayer';
import BackspaceIcon from '@mui/icons-material/Backspace';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DialpadIcon from '@mui/icons-material/Dialpad';

// Custom styled FAQ question button to avoid default MUI button classes
const FaqQuestionButton = styled(Button)(({ theme }) => ({
  fontWeight: 600,
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
  padding: '8px 12px',
  border: '1px solid var(--museum-gold)',
  borderRadius: 8,
  backgroundColor: 'var(--museum-bg)',
  color: 'var(--museum-blue)',
  textTransform: 'none',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  boxShadow: 'none',
  '&:hover': {
    backgroundColor: 'var(--museum-gold)',
    color: 'var(--museum-blue)',
    boxShadow: 'none',
  },
  '&.MuiButton-root': {
    boxShadow: 'none',
  },
}));

function ObjectDetails() {
  const { museumTitle, roomTitle, objectTitle } = useParams();
  const [object, setObject] = useState(null);
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { ticketCode } = useTicket();
const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [modalOpen, setModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectionError, setSelectionError] = useState('');

  // Audio controls
  
  // Info modal toggle
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Help page slide
  const [showHelp, setShowHelp] = useState(false);

  // Menu for audio options
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);

  // FAQ state: track which questions are open
  const [faqOpen, setFaqOpen] = useState({});

  useEffect(() => {
    if (!ticketCode) {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        const roomObjectsRes = await api.get(
          `/public/museum-room-objects/${ticketCode}/${encodeURIComponent(roomTitle)}`
        );
        if (roomObjectsRes.data.valid) {
          setObjects(roomObjectsRes.data.objects);
        } else {
          setError(roomObjectsRes.data.message || 'Invalid or expired ticket');
          setLoading(false);
          return;
        }

        const objectRes = await api.get(
          `/public/object-details/${ticketCode}/${encodeURIComponent(objectTitle)}`
        );

        if (objectRes.data.valid) {
          setObject(objectRes.data.object);
        } else {
          setError(objectRes.data.message || 'Invalid or expired ticket');
        }

        setLoading(false);
      } catch (err) {
        setError('Error fetching data');
        setLoading(false);
      }
    };

    fetchData();
  }, [museumTitle, roomTitle, objectTitle, ticketCode, navigate]);
  const handleBackClick = () => {
    navigate(`/${encodeURIComponent(museumTitle)}/rooms/${encodeURIComponent(roomTitle)}`);
  };

  const openModal = () => {
    setInputValue('');
    setSelectionError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectionError('');
  };

  const handleNumberClick = (num) => {
    if (inputValue.length < 6) {
      setInputValue((prev) => prev + num.toString());
      setSelectionError('');
    }
  };

  const handleBackspace = () => {
    setInputValue((prev) => prev.slice(0, -1));
    setSelectionError('');
  };

  const handleCircleClick = (num) => {
    setInputValue(num.toString());
    setSelectionError('');
  };

  const handleGo = () => {
    const idNum = inputValue.toString().trim();
    if (!idNum) {
      setSelectionError('Please enter or select an object number');
      return;
    }
    const obj = objects.find((o) => o.id.toString() === idNum);
    if (obj) {
      setModalOpen(false);
      navigate(
        `/${encodeURIComponent(museumTitle)}/rooms/${encodeURIComponent(roomTitle)}/${encodeURIComponent(obj.title)}`
      );
    } else {
      setSelectionError(`Object number ${idNum} does not exist`);
    }
  };
  // Help page handlers
  const openHelp = () => setShowHelp(true);
  const closeHelp = () => setShowHelp(false);

  // FAQ toggle handler
  const toggleFaq = (index) => {
    setFaqOpen((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };
  if (loading) return <div className="object-details-loading">Loading object details...</div>;
  if (error) return <div className="object-details-error">{error}</div>;
  if (!object) return <div className="object-details-error">Object not found</div>;

  // FAQ data related to your platform
  const faqData = [
    {
      question: "Comment puis-je utiliser le code d'accès pour accéder au guide audio ?",
      answer:
        "Vous pouvez utiliser le code d'accès en le saisissant ou en le scannant à l'entrée du musée pour accéder aux visites audio des différentes salles et objets.",
    },
    {
      question: "Comment naviguer entre les différentes salles et objets du musée ?",
      answer:
        "Une fois connecté, vous pouvez explorer les différentes salles du musée et sélectionner les objets pour écouter leurs guides audio associés.",
    },
    {
      question: "Puis-je écouter le guide audio en plusieurs langues ?",
      answer:
        "Oui, si le musée propose plusieurs langues, vous pouvez choisir votre langue préférée dans les paramètres de l'application avant de commencer la visite.",
    },
    {
      question: "Comment puis-je contrôler la lecture audio pendant la visite ?",
      answer:
        "Vous pouvez utiliser les boutons de lecture, pause, avance et retour rapide, ainsi que la barre de progression pour naviguer dans le guide audio de chaque objet.",
    },
    {
      question: "Que faire si je ne trouve pas un objet ou une salle dans le guide ?",
      answer:
        "Assurez-vous que votre code d'accès est valide et que vous avez bien sélectionné le musée et la salle corrects. Contactez le support si le problème persiste.",
    },
  ];

  return (
    <>
      <div className="object-details-page">
        <header className="object-details-header">
  <div className="header-left">
    <Button
      variant="contained"
      onClick={handleBackClick}
      className="back-btn"
      sx={{
        backgroundColor: 'var(--museum-blue)',
        color: 'var(--white)',
        '&:hover': {
          backgroundColor: 'var(--museum-gold)',
          color: 'var(--museum-blue)',
        },
      }}
    >
      <ArrowBackIosNewIcon fontSize="small" sx={{ mr: 1 }} />
      
    </Button>
  </div>

  <div className="header-right-buttons">
    {!isMobile ? (
      <Button
        variant="contained"
        onClick={openModal}
        className="select-object-btn"
        sx={{
          backgroundColor: 'var(--museum-blue)',
          color: 'var(--white)',
          fontWeight: 700,
          padding: '10px 28px',
          borderRadius: '30px',
          fontSize: '1rem',
          boxShadow: '0 2px 8px rgba(45, 58, 74, 0.5)',
          textTransform: 'none',
          whiteSpace: 'nowrap',
          '&:hover': {
            backgroundColor: 'var(--museum-gold)',
            color: 'var(--museum-blue)',
          },
        }}
      >
        Select Object Number
      </Button>
    ) : (
      <IconButton
        aria-label="Select Object Number"
        onClick={openModal}
        size="large"
        sx={{
          backgroundColor: 'var(--museum-blue)',
          color: 'var(--white)',
          '&:hover': {
            backgroundColor: 'var(--museum-gold)',
            color: 'var(--museum-blue)',
          },
          borderRadius: '50%',
          padding: 1.5,
          boxShadow: '0 2px 8px rgba(45, 58, 74, 0.5)',
        }}
      >
        <DialpadIcon fontSize="inherit" />
      </IconButton>
    )}

    <IconButton
      aria-label="Help"
      onClick={openHelp}
      size="large"
      className="icon-btn help-btn"
      sx={{
        backgroundColor: 'var(--museum-blue)',
        color: 'var(--white)',
        borderRadius: '50%',
        padding: 1.5,
        boxShadow: '0 2px 8px rgba(45, 58, 74, 0.5)',
        '&:hover': {
          backgroundColor: 'var(--museum-gold)',
          color: 'var(--museum-blue)',
        },
        minWidth: 48,
        minHeight: 48,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <HelpOutlineIcon fontSize="inherit" />
    </IconButton>
  </div>
</header>

        <div className="object-details-content-scroll">
          <div className="object-details-image-block">
            <img
              src={`https://nasro.expedgs-audioguide.duckdns.org/images/${object.photo}`}
              alt={object.title}
              className="object-details-image"
            />
          </div>

          <div className="object-details-title-block">
            <h2 className="object-details-section">{object.section || roomTitle}</h2>
            <h1 className="object-details-title">{object.title}</h1>

            <Button
              variant="outlined"
              onClick={() => setShowInfoModal(true)}
              aria-haspopup="true"
              startIcon={<InfoOutlinedIcon />}
              sx={{
                marginTop: 1,
                borderRadius: '30px',
                padding: '6px 16px',
                fontWeight: 600,
                color: '#2d3a4a',
                borderColor: '#bfa14a',
                backgroundColor: 'transparent',
                boxShadow: '0 2px 8px rgba(191, 161, 74, 0.5)',
                textTransform: 'none',
                whiteSpace: 'nowrap',
                '&:hover': {
                  backgroundColor: '#2d3a4a',
                  color: '#bfa14a',
                  borderColor: '#bfa14a',
                },
              }}
            >
              Info
            </Button>
          </div>
        </div>

        <Dialog
          open={showInfoModal}
          onClose={() => setShowInfoModal(false)}
          aria-labelledby="info-dialog-title"
          maxWidth="sm"
          fullWidth
          PaperProps={{ className: 'info-dialog-paper' }}
        >
          <DialogTitle id="info-dialog-title" sx={{ color: 'var(--museum-blue)', fontWeight: 'bold' }}>
            {object.title} - Info
          </DialogTitle>
          <DialogContent dividers>
            <Typography
              className="object-details-description"
              dangerouslySetInnerHTML={{ __html: object.description }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowInfoModal(false)} sx={{ color: 'var(--museum-blue)' }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
<AudioPlayer src={`https://nasro.expedgs-audioguide.duckdns.org/images/${object.audio}`} />


        {/* Modal for selecting object number */}
        <Dialog open={modalOpen} onClose={closeModal} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ color: 'var(--museum-blue)', fontWeight: 'bold' }}>
            Select Object Number
          </DialogTitle>
          <DialogContent>
            {/* Numbers grid on top */}
            {/* <Box sx={{ mb: 3, maxHeight: 150, overflowY: 'auto' }}>
              <Grid container spacing={1} justifyContent="center">
                {objects.length === 0 ? (
                  <Typography sx={{ p: 2, color: 'var(--museum-blue)' }}>No objects available</Typography>
                ) : (
                  objects.map((obj) => (
                    <Grid item key={obj.id}>
                      <Button
                        variant={inputValue === obj.id.toString() ? 'contained' : 'outlined'}
                        onClick={() => handleCircleClick(obj.id)}
                        sx={{
                          minWidth: 56,
                          minHeight: 56,
                          borderRadius: '50%',
                          fontWeight: 'bold',
                          fontSize: '1.25rem',
                          color: inputValue === obj.id.toString() ? 'var(--museum-blue)' : 'var(--museum-gold)',
                          borderColor: 'var(--museum-gold)',
                          '&:hover': {
                            backgroundColor: 'var(--museum-gold)',
                            color: 'var(--museum-blue)',
                            borderColor: 'var(--museum-gold)',
                          },
                        }}
                      >
                        {obj.id}
                      </Button>
                    </Grid>
                  ))
                )}
              </Grid>
            </Box> */}

            {/* Phone dialer style input */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                userSelect: 'none',
                mb: 2,
              }}
            >
              <Box
                sx={{
                  fontSize: '3rem',
                  fontWeight: 'bold',
                  color: 'var(--museum-blue)',
                  border: '2px solid var(--museum-gold)',
                  borderRadius: 4,
                  width: '100%',
                  maxWidth: 300,
                  textAlign: 'center',
                  padding: '12px 0',
                  letterSpacing: 4,
                  marginBottom: 2,
                  backgroundColor: '#fff',
                  boxShadow: '0 2px 8px rgba(44,58,74,0.1)',
                }}
              >
                {inputValue || '—'}
              </Box>

              <Grid container spacing={1} maxWidth={300} justifyContent="center">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
                  <Grid item xs={4} key={num}>
                    <Button
                      variant="outlined"
                      onClick={() => handleNumberClick(num)}
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: 'var(--museum-blue)',
                        borderColor: 'var(--museum-gold)',
                        '&:hover': {
                          backgroundColor: 'var(--museum-gold)',
                          color: 'var(--museum-blue)',
                          borderColor: 'var(--museum-gold)',
                        },
                      }}
                    >
                      {num}
                    </Button>
                  </Grid>
                ))}
                <Grid item xs={4}>
                  <IconButton
                    onClick={handleBackspace}
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      border: '2px solid var(--museum-gold)',
                      color: 'var(--museum-blue)',
                      '&:hover': {
                        backgroundColor: 'var(--museum-gold)',
                        color: 'var(--museum-blue)',
                      },
                    }}
                    aria-label="Backspace"
                  >
                    <BackspaceIcon fontSize="large" />
                  </IconButton>
                </Grid>
              </Grid>
            </Box>

            {selectionError && (
              <Typography color="error" sx={{ mt: 1, textAlign: 'center' }}>
                {selectionError}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeModal} sx={{ color: 'var(--museum-blue)' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleGo}
              sx={{
                backgroundColor: 'var(--museum-gold)',
                color: 'var(--museum-blue)',
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: 'var(--museum-blue)',
                  color: 'var(--museum-gold)',
                },
              }}
            >
              Go
            </Button>
          </DialogActions>
        </Dialog>
      </div>

      {/* Help page slide-in */}
      <Slide direction="left" in={showHelp} mountOnEnter unmountOnExit>
        <div className="help-page">
          <header className="help-header">
            <IconButton
              aria-label="Back"
              onClick={closeHelp}
              className="icon-btn back-btn"
              size="large"
            >
              <ArrowBackIosNewIcon fontSize="inherit" />
            </IconButton>
            <Typography variant="h6" component="h2" className="help-title">
              Aide 
            </Typography>
          </header>
          <div className="help-content">
            <Typography variant="body1" paragraph>
              Nous sommes là pour vous aider avec tout ce dont vous avez besoin
            </Typography>
            <Typography variant="body2" paragraph>
              Cette section sert de référence rapide pour obtenir des réponses aux questions fréquentes .
            </Typography>
            <Typography variant="h6" component="h4" gutterBottom>
              FAQ
            </Typography>
            <ul className="faq-list" style={{ paddingLeft: 0, listStyle: 'none' }}>
              {faqData.map((item, index) => (
                <li key={index} className="faq-item" style={{ marginBottom: 12 }}>
                  <FaqQuestionButton
                    onClick={() => toggleFaq(index)}
                    aria-expanded={!!faqOpen[index]}
                    aria-controls={`faq-answer-${index}`}
                    endIcon={
                      <ExpandMoreIcon
                        sx={{
                          transform: faqOpen[index] ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s ease',
                        }}
                      />
                    }
                  >
                    {item.question}
                  </FaqQuestionButton>
                  <Collapse in={!!faqOpen[index]} timeout="auto" unmountOnExit>
                    <Typography
                      id={`faq-answer-${index}`}
                      sx={{
                        padding: '8px 16px',
                        borderLeft: '3px solid var(--museum-gold)',
                        backgroundColor: '#fff',
                        marginTop: 1,
                        color: '#444',
                        fontSize: '1rem',
                        lineHeight: 1.5,
                      }}
                      paragraph
                    >
                      {item.answer}
                    </Typography>
                  </Collapse>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Slide>
    </>
  );
}

export default ObjectDetails;