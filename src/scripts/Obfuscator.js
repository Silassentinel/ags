// This function will obfuscate data by appending data to the end of the bitstream of a file or foto
// input data will vary from JSON's which are the reponses of api calls to general data
const Obfuscate = (e) =>
{
    if (!e) return;


    if (typeof e === 'WritableStream')
    {
        // tapping into the stream
        // finding the end of the stream to append data
        e.on('finish', () => {
            e.write('data');
        }
        );

        // when done writing to the stream close it.
        e.close();
    }
};



const DeObfuscate = (e) =>
{
    // if the data is obfuscated, this function will deobfuscate the data
    // this function will be called when the data is being read

    if (!e) return

    if (typeof e === 'ReadableStream')
    {
        // tapping into the stream
        // finding the end of the stream to append data
        e.on('readable', () => {
            e.read();
        }
        );

        // When done reading from the stream close it.
        e.close();
    }
}