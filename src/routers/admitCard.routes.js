import express from 'express';
import { 
    generateSingleAdmitCard, 
    generateBulkAdmitCards, 
    getAdmitCardList,
    downloadAdmitCardById,
    getAdmitCardByStudentId ,
    isAdmitCardAvailable
    // downloadAdmitCard, 
    // checkAdmitCardStatus, 
    // releaseAdmitCard
} from '../controllers/admitCard.controller.js'; // Import the controller functions

const router = express.Router();

router.post('/admitCard/generate/single',  generateSingleAdmitCard); //
router.post('/admitCard/generate/bulk',  generateBulkAdmitCards);
router.get('/admitCard/list', getAdmitCardList);
router.get('/admitCard/download/:id', downloadAdmitCardById);
router.get('/admit-card/:studentId', getAdmitCardByStudentId )


// Add to your routes
router.get('/admitCard/check', isAdmitCardAvailable);
router.get('/verify/:id', downloadAdmitCardById);


export default router;
