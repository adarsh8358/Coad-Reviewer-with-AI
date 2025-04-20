import { Router } from "express";
import { createProjectController, getAllProjectsController } from "../controllers/project.controller.js";

const router = Router();



router.post("/create", createProjectController)

router.get('/get-all', getAllProjectsController)



export default router;