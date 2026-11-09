import type { CourseModule, ModuleLesson } from '@/types/contract';

import { rpc, rpcVoid } from './rpc';

/** Módulos do nível (o nível em estudo, se `levelId` for omitido). */
export function getCourseOverview(levelId?: string): Promise<CourseModule[]> {
  return rpc<CourseModule[]>('get_course_overview', levelId ? { p_level_id: levelId } : {});
}

/** Lança `module_locked` ou `premium_required` quando o módulo não está acessível. */
export function getModuleLessons(moduleId: string): Promise<ModuleLesson[]> {
  return rpc<ModuleLesson[]>('get_module_lessons', { p_module_id: moduleId });
}

export function refreshMyUnlocks(): Promise<void> {
  return rpcVoid('refresh_my_unlocks', {});
}
