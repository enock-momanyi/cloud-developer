
import {TodoAcess} from '../dataLayer/todoAcess'


const todoAcess = new TodoAcess()
export async function saveFile(s3Url: string, todoId: string, userId:string):Promise<void> {
    await todoAcess.saveFile(s3Url, todoId,userId)   
}
