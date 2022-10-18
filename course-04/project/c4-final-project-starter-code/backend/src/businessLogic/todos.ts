//import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import * as uuid from 'uuid'
import { TodoAcess } from '../dataLayer/todoAcess'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'


const todoAcess = new TodoAcess()
const bucketName = process.env.ATTACHMENT_S3_BUCKET

const expirationDuration = process.env.SIGNED_URL_EXPIRATION

export async function createTodo(createTodoRequest: CreateTodoRequest, userId: string): Promise<TodoItem>{
  const todoId = uuid.v4()

  return await todoAcess.createTodo({
    userId: userId,
    todoId: todoId,
    createdAt: new Date().toISOString(),
    name: createTodoRequest.name,
    dueDate: createTodoRequest.dueDate,
    attachmentUrl:''
    ,
    done: false
  })
}

export async function updateTodo(updateTodoRequest: UpdateTodoRequest, todoId: string, userId: string){
  return await todoAcess.updateTodo(updateTodoRequest,todoId, userId)
}

export async function deleteTodo(todoId: string, userId: string): Promise<void>{
  await todoAcess.deleteTodo(todoId, userId)
}

export async function getTodosForUser(userId: string): Promise<TodoItem[]>{
  return await todoAcess.getTodos(userId)
}

export function createAttachmentPresignedUrl(objectID: string){
    const XAWS = AWSXRay.captureAWS(AWS)
    const s3 = new XAWS.S3({
        signatureVersion: 'v4'
      })
  
      return s3.getSignedUrl('putObject',{
        Bucket: bucketName,
        Key: objectID,
        Expires: Number(expirationDuration)
      })
}

