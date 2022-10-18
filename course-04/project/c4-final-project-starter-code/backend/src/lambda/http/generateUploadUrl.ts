import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import * as AWS from 'aws-sdk'
//import * as AWSXRay from 'aws-xray-sdk'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { createAttachmentPresignedUrl } from '../../businessLogic/todos'
import { getUserId } from '../utils'
import { saveFile } from '../../dataStorage/attachmentUtils'
const AWSXRay = require('aws-xray-sdk')
const XAWS = AWSXRay.captureAWS(AWS)
const docClient = new XAWS.DynamoDB.DocumentClient()
const todoTable = process.env.TODOS_TABLE
const bucketName = process.env.ATTACHMENT_S3_BUCKET
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
    const validItem = await itemExists(todoId, getUserId(event))
    if(!validItem){
      return{
        statusCode: 404,
        body: ''
      }
    }
    const fileUrl = `https://${bucketName}.s3.amazonaws.com/${todoId}`
    await saveFile(fileUrl, todoId, getUserId(event))
    const presignedUrl = createAttachmentPresignedUrl(todoId)
    return {
      statusCode: 201,
      body: JSON.stringify({uploadUrl:presignedUrl})
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

  async function itemExists(todoId:string, userId: string):Promise<Boolean> {
    const item = await docClient.get({
      TableName: todoTable,
      Key: {
        userId: userId,
        todoId: todoId
      }
    }).promise()

    return !!item.Item
  }
