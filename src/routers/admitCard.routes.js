import express from 'express';
import { 
    generateSingleAdmitCard, 
    generateBulkAdmitCards, 
    // downloadAdmitCard, 
    // checkAdmitCardStatus, 
    // releaseAdmitCard
} from '../controllers/admitCard.controller.js'; // Import the controller functions

const router = express.Router();

router.post('/admitCard/generate/single',  generateSingleAdmitCard);
router.post('/admitCard/generate/bulk',  generateBulkAdmitCards);

export default router;
