import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { createAttachmentPresignedUrl } from '../../businessLogic/todos'
import { getUserId } from '../utils'
const XAWS = AWSXRay.captureAWS(AWS)
const docClient = new XAWS.DynamoDB.DocumentClient()
const todoTable = process.env.TODOS_TABLE
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
    const validItem = await itemExists(todoId)
    if(!validItem){
      return{
        statusCode: 404,
        body: ''
      }
    }
    const presignedUrl = createAttachmentPresignedUrl(todoId)
    return {
      statusCode: 201,
      body: JSON.stringify({presignedUrl})
    }
  }
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )

  async function itemExists(todoId:string):Promise<Boolean> {
    const item = await docClient.get({
      TableName: todoTable,
      Key: {
        todoId: todoId
      }
    }).promise()

    return !!item.Item
  }
