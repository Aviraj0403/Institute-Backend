import express from 'express';
import { 
    generateSingleAdmitCard, 
    generateBulkAdmitCards, 
    getAdmitCardList,
    downloadAdmitCardById,
    getAdmitCardByStudentId 
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

export default router;
