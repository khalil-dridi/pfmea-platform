import { Routes } from '@angular/router';
import { AiAssistant } from './pages/ai-assistant/ai-assistant';

export const AI_ASSISTANT_ROUTES: Routes = [
  {
    path: '',
    component: AiAssistant,
    data: { title: 'AI Assistant' }
  }
];
