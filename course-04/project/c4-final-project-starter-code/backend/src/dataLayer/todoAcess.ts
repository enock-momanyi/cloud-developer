import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import {DocumentClient} from 'aws-sdk/clients/dynamodb'
import {TodoItem} from '../models/TodoItem'
import {TodoUpdate} from '../models/TodoUpdate'
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
        const todos = this.docClient.query({
            TableName: this.todoTable,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAtttributeValue:{
              'userId': userId
            }
          }).promise()
          return todos.Items
    }
    async updateTodo(updatedTodoItem: TodoUpdate,todoId: string): Promise<TodoUpdate>{
        const updateParams = {
            TableName: this.todoTable,
            Key: {
              todoId: todoId
            },
            UpdateExpression: "set name = :name, dueDate = :dueDate, done = :done",
            ExpressionAttributeValues: {
              ":name": updatedTodoItem.name,
              ":dueDate": updatedTodoItem.dueDate,
              ":done": updatedTodoItem.done
            }
          }
          await this.docClient.update(updateParams).promise()
          return updatedTodoItem
    }
    async deleteTodo(todoId: string): Promise<void>{
        const deleteParams = {
            TableName: this.todoTable,
            key :{
              'todoId': todoId
            }
          }
        await this.docClient.delete(deleteParams).promise()
    }
    async saveFile(s3Url:string, todoId: string):Promise<void>{
      const updateParams = {
        TableName: this.todoTable,
        Key:{
          todoId:todoId
        },
        UpdateExpression: "set attachmentUrl = :attachmentUrl",
        ExpressionAttributes: {
          ":attachmentUrl": s3Url
        }
      }
      await this.docClient.update(updateParams).promise()
    }
}
