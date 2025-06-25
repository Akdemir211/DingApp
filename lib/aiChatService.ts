import { supabase } from './supabase';
import { PostgrestError } from '@supabase/supabase-js';

/**
 * UUID v4 formatına uygun benzersiz bir ID oluşturur (crypto olmadan)
 * Standart UUID formatı: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 */
function generateUUID(): string {
  let dt = new Date().getTime();
  
  // Zaman tabanlı rasgele karakter oluşturma için temel
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (dt + Math.random() * 16) % 16 | 0;
    dt = Math.floor(dt / 16);
    // x yerine rasgele, y yerine 8,9,A,B karakterleri (UUID v4 formatı gereği)
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
  
  return uuid;
}

// Kullanıcı bilgileri tipi
export interface UserInfo {
  id: string;
  name?: string | null;
  grade?: string | null;
  targetProfession?: string | null;
  examScore?: number | null;
  strongSubjects?: string[] | null;
  weakSubjects?: string[] | null;
  assignments?: UserAssignment[];
}

// Ödev tipi
export interface UserAssignment {
  id: string;
  userId: string;
  description: string;
  subject: string;
  dueDate: Date;
  isCompleted: boolean;
  createdAt: Date;
}

// Mesaj tipi
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Supabase veritabanı tabloları için tipler
type DbUser = {
  id: string;
  name: string | null;
  grade: string | null;
  target_profession: string | null;
  exam_score: number | null;
  strong_subjects: string[] | null;
  weak_subjects: string[] | null;
}

type DbAssignment = {
  id: string;
  user_id: string;
  description: string;
  subject: string;
  due_date: string;
  is_completed: boolean;
  created_at: string;
}

type DbChatMessage = {
  id: string;
  user_id: string;
  role: string;
  content: string;
  created_at: string;
}

/**
 * Kullanıcı bilgilerini getir
 * @param userId - Kullanıcı ID
 * @returns Kullanıcı bilgileri
 */
export async function getUserInfo(userId: string): Promise<UserInfo | null> {
  try {
    // Kullanıcı verilerini getir
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, grade, target_profession, exam_score, strong_subjects, weak_subjects')
      .eq('id', userId)
      .single();
    
    if (userError) throw userError;
    
    // Ödevleri getir
    const { data: assignmentsData, error: assignmentError } = await supabase
      .from('user_assignments')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: false });
    
    if (assignmentError) throw assignmentError;

    const typedUserData = userData as unknown as DbUser;
    const assignments = assignmentsData as unknown as DbAssignment[];
    
    // Kullanıcı bilgisi formatla
    const userInfo: UserInfo = {
      id: typedUserData.id,
      name: typedUserData.name,
      grade: typedUserData.grade,
      targetProfession: typedUserData.target_profession,
      examScore: typedUserData.exam_score,
      strongSubjects: typedUserData.strong_subjects,
      weakSubjects: typedUserData.weak_subjects,
      assignments: assignments.map(a => ({
        id: a.id,
        userId: a.user_id,
        description: a.description,
        subject: a.subject,
        dueDate: new Date(a.due_date),
        isCompleted: a.is_completed,
        createdAt: new Date(a.created_at)
      }))
    };
    
    return userInfo;
  } catch (error) {
    console.error('Kullanıcı bilgisi getirme hatası:', error);
    return null;
  }
}

/**
 * Kullanıcı bilgilerini güncelle
 * @param userId - Kullanıcı ID
 * @param userInfo - Güncellenecek kullanıcı bilgileri
 * @returns Başarılı olup olmadığı
 */
export async function updateUserInfo(
  userId: string, 
  userInfo: Partial<Omit<UserInfo, 'id' | 'assignments'>>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        name: userInfo.name,
        grade: userInfo.grade,
        target_profession: userInfo.targetProfession,
        exam_score: userInfo.examScore,
        strong_subjects: userInfo.strongSubjects,
        weak_subjects: userInfo.weakSubjects
      })
      .eq('id', userId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Kullanıcı güncelleme hatası:', error);
    return false;
  }
}

/**
 * Kullanıcı ödevi oluştur
 * @param userId - Kullanıcı ID
 * @param assignment - Ödev bilgileri
 * @returns Oluşturulan ödevin ID'si veya null
 */
export async function createAssignment(
  userId: string,
  assignment: Omit<UserAssignment, 'id' | 'userId' | 'createdAt'>
): Promise<string | null> {
  try {
    const id = generateUUID();
    
    const { error } = await supabase
      .from('user_assignments')
      .insert({
        id,
        user_id: userId,
        description: assignment.description,
        subject: assignment.subject,
        due_date: assignment.dueDate.toISOString(),
        is_completed: assignment.isCompleted,
      });
    
    if (error) throw error;
    return id;
  } catch (error) {
    console.error('Ödev oluşturma hatası:', error);
    return null;
  }
}

/**
 * Ödev durumunu güncelle
 * @param assignmentId - Ödev ID
 * @param isCompleted - Tamamlanma durumu
 * @returns Başarılı olup olmadığı
 */
export async function updateAssignmentStatus(
  assignmentId: string,
  isCompleted: boolean
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_assignments')
      .update({ is_completed: isCompleted })
      .eq('id', assignmentId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Ödev güncelleme hatası:', error);
    return false;
  }
}

/**
 * Sohbet geçmişini getir
 * @param userId - Kullanıcı ID
 * @param limit - Maksimum mesaj sayısı
 * @returns Sohbet mesajları
 */
export async function getChatHistory(
  userId: string,
  limit: number = 50
): Promise<ChatMessage[]> {
  try {
    const { data: messagesData, error } = await supabase
      .from('ai_chat_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(limit);
    
    if (error) throw error;
    
    if (!messagesData || messagesData.length === 0) {
      return [];
    }
    
    const messages = messagesData as unknown as DbChatMessage[];
    
    return messages.map(message => ({
      id: message.id,
      role: message.role as 'user' | 'assistant',
      content: message.content,
      timestamp: new Date(message.created_at)
    }));
  } catch (error) {
    console.error('Sohbet geçmişi getirme hatası:', error);
    return [];
  }
}

/**
 * Mesaj ekle
 * @param userId - Kullanıcı ID
 * @param message - Eklenecek mesaj
 * @returns Eklenen mesajın ID'si veya null
 */
export async function addChatMessage(
  userId: string,
  message: Omit<ChatMessage, 'id'>
): Promise<string | null> {
  try {
    const id = generateUUID();
    
    const { error } = await supabase
      .from('ai_chat_history')
      .insert({
        id,
        user_id: userId,
        role: message.role,
        content: message.content,
        created_at: message.timestamp.toISOString()
      });
    
    if (error) throw error;
    return id;
  } catch (error) {
    console.error('Mesaj ekleme hatası:', error);
    return null;
  }
}

/**
 * Sohbet geçmişini temizle
 * @param userId - Kullanıcı ID
 * @returns Başarılı olup olmadığı
 */
export async function clearChatHistory(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ai_chat_history')
      .delete()
      .eq('user_id', userId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Sohbet geçmişi temizleme hatası:', error);
    return false;
  }
} 