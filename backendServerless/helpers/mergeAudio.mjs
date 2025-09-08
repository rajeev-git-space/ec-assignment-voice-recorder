import { S3Client, GetObjectCommand, ListObjectsV2Command, DeleteObjectsCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { validateMergeAudio } from '../validations/audioValidations.mjs';

const s3 = new S3Client();

const downloadFfmpegFromS3 = async () => {
    const ffmpegKey = 'ffmpeg-binary-data/ffmpeg'; // S3 path to the ffmpeg binary
    const localFfmpegPath = '/tmp/ffmpeg'; // Local path in Lambda tmp directory

    // Fetch the ffmpeg binary from S3
    const getObjectResponse = await s3.send(new GetObjectCommand({
        Bucket: 'ec-voice-recorder-app',
        Key: ffmpegKey,
    }));

    // Create a writable stream to store the ffmpeg binary
    const writeStream = fs.createWriteStream(localFfmpegPath);
    getObjectResponse.Body.pipe(writeStream);

    return new Promise((resolve, reject) => {
        writeStream.on('finish', () => {
            // Set execute permissions for the ffmpeg binary
            fs.chmodSync(localFfmpegPath, '755');
            resolve(localFfmpegPath);
        });

        writeStream.on('error', reject);
    });
};

const createFileList = async (chunks) => {
    const fileListPath = '/tmp/filelist.txt';
    const fileContent = chunks
        .map((chunk, index) => `file '/tmp/chunk${index}.webm'`)
        .join('\n');

    fs.writeFileSync(fileListPath, fileContent);
    return fileListPath;
};

const mergeAudioWithFfmpeg = async (chunks, outputFile) => {
    // Download ffmpeg binary from S3 to /tmp directory
    const ffmpegPath = await downloadFfmpegFromS3();

    // Save each chunk to a temporary file
    const inputFiles = chunks.map((chunk, index) => {
        const tempFilePath = path.join('/tmp', `chunk${index}.webm`);
        fs.writeFileSync(tempFilePath, chunk);
        return tempFilePath;
    });

    // Create a file list for ffmpeg to concatenate
    const fileListPath = await createFileList(chunks);

    return new Promise((resolve, reject) => {
        // Construct the ffmpeg command to merge audio chunks and convert them to WebM format with opus codec
        const args = [
            '-f', 'concat',
            '-safe', '0',
            '-i', fileListPath, // Use the generated file list
            '-c:v', 'copy', // No video stream, copy the video stream as is (if any)
            '-c:a', 'libopus', // Use opus codec for audio
            '-b:a', '128k', // Set audio bitrate to 128kbps
            outputFile
        ];

        // Execute ffmpeg command
        execFile(ffmpegPath, args, (error, stdout, stderr) => {
            if (error) {
                reject(`ffmpeg error: ${stderr}`);
            } else {
                resolve(outputFile);
            }
        });
    });
};

export const mergeAudio = async (event) => {
    const input = JSON.parse(event.body);
    const { error } = validateMergeAudio(input);
    if (error) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: error.details[0].message }),
        };
    }

    const { chunk_uuid, recording_name } = input;
    const tempBucket = 'temporary-audio-chunks';
    const finalBucket = 'ec-voice-recorder-app';

    try {
        const listResponse = await s3.send(
            new ListObjectsV2Command({ Bucket: tempBucket, Prefix: `${chunk_uuid}/` })
        );

        if (!listResponse.Contents || listResponse.Contents.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'No audio chunks found for the given chunk_uuid.' }),
            };
        }

        const chunks = [];
        for (const item of listResponse.Contents) {
            const getObjectResponse = await s3.send(
                new GetObjectCommand({ Bucket: tempBucket, Key: item.Key })
            );
            const data = await streamToBuffer(getObjectResponse.Body);
            chunks.push(data);
        }

        const mergedFilePath = `/tmp/${recording_name}.webm`;

        // Use ffmpeg to merge the audio chunks
        await mergeAudioWithFfmpeg(chunks, mergedFilePath);

        // Upload the merged file to the final S3 bucket
        await s3.send(
            new PutObjectCommand({
                Bucket: finalBucket,
                Key: `merged-audio/${recording_name}.webm`,
                Body: fs.createReadStream(mergedFilePath),
                ContentType: 'audio/webm',
                ACL: 'public-read',
            })
        );

        // Delete chunks from temporary bucket
        const deleteObjects = listResponse.Contents.map((object) => ({ Key: object.Key }));
        const deleteParams = { Bucket: tempBucket, Delete: { Objects: deleteObjects } };
        await s3.send(new DeleteObjectsCommand(deleteParams));

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Audio merged and uploaded successfully.' }),
        };
    }
    catch (err) {
        console.error('Error during merge operation:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error during merge operation.', error: err.message }),
        };
    }
};

// Utility function to convert a stream to a buffer
const streamToBuffer = async (stream) => {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
};
