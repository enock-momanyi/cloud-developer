import * as AWS from 'aws-sdk'
//import * as AWSXRay from 'aws-xray-sdk'
import {DocumentClient} from 'aws-sdk/clients/dynamodb'
import {TodoItem} from '../models/TodoItem'
import {TodoUpdate} from '../models/TodoUpdate'
const AWSXRay = require('aws-xray-sdk')
const XAWS = AWSXRay.captureAWS(AWS)
export class TodoAcess{
    constructor(
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly todoTable: string = process.env.TODOS_TABLE
    ){}

    async createTodo(todoItem: TodoItem): Promise<TodoItem> {
        await this.docClient.put({
            TableName: this.todoTable,
            Item: todoItem
        }).promise()
        return todoItem
    }
    async getTodos(userId: string): Promise<TodoItem[]>{
        const todos =  await this.docClient.query({
            TableName: this.todoTable,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues:{
              ':userId': userId
            }
          }).promise()
          const items = todos.Items
          return items as TodoItem[]
    }
    async updateTodo(updatedTodoItem: TodoUpdate,todoId: string,userId: string): Promise<TodoUpdate>{
        const updateParams = {
            TableName: this.todoTable,
            Key: {
              userId: userId,
              todoId: todoId
            },
            UpdateExpression: "set #nm = :name, dueDate = :dueDate, done = :done",
            ExpressionAttributeValues: {
              ":name": updatedTodoItem.name,
              ":dueDate": updatedTodoItem.dueDate,
              ":done": updatedTodoItem.done
            },
            ExpressionAttributeNames: {
              "#nm": 'name'
            }
          }
          await this.docClient.update(updateParams).promise()
          return updatedTodoItem
    }

    async deleteTodo(todoId: string, userId:string): Promise<void>{
        const deleteParams = {
            TableName: this.todoTable,
            Key :{
              'userId': userId,
              'todoId': todoId
            },
          }
        await this.docClient.delete(deleteParams).promise()
    }
    async saveFile(s3Url:string, todoId: string,userId: string):Promise<void>{
      const updateParams = {
        TableName: this.todoTable,
        Key:{
          userId: userId,
          todoId:todoId
        },
        UpdateExpression: "set attachmentUrl = :attachmentUrl",
        ExpressionAttributeValues: {
          ":attachmentUrl": s3Url
        }
      }
      await this.docClient.update(updateParams).promise()
    }
}
