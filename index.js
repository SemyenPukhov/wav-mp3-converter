const STEREO_LEN_DEVIDER = 4;
const MONO_LEN_DEVIDER = 2;

const wavFile = document.getElementById("wav-file");
const convertBtn = document.getElementById("convert-btn");

function encodeMono(channels, sampleRate, samples) {
  const buffer = [];
  const mp3enc = new lamejs.Mp3Encoder(channels, sampleRate, 128);
  let remaining = samples.length;
  const maxSamples = 1152;

  for (let i = 0; remaining >= maxSamples; i += maxSamples) {
    const mono = samples.subarray(i, i + maxSamples);
    const mp3buf = mp3enc.encodeBuffer(mono);

    if (mp3buf.length > 0) {
      buffer.push(new Int8Array(mp3buf));
    }

    remaining -= maxSamples;
  }

  const d = mp3enc.flush();

  if (d.length > 0) {
    buffer.push(new Int8Array(d));
  }

  renderDownloadLink(buffer);
}

function encodeStereo(channels, sampleRate, samples) {
  const mp3Data = [];
  const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, 128);

  const left = new Int16Array(samples);
  const right = new Int16Array(samples);

  const sampleBlockSize = 1152;

  for (let i = 0; i < samples.length; i += sampleBlockSize) {
    let leftChunk = left.subarray(i, i + sampleBlockSize);
    let rightChunk = right.subarray(i, i + sampleBlockSize);

    const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);

    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
  }

  const mp3buf = mp3encoder.flush();

  if (mp3buf.length > 0) {
    mp3Data.push(mp3buf);
  }

  renderDownloadLink(mp3Data);
}

function renderDownloadLink(buffer) {
  if (!buffer || !buffer.length) {
    console.warn("Invalid or empty buffer");
    return;
  }

  const blob = new Blob(buffer, { type: "audio/mp3" });
  const bUrl = window.URL.createObjectURL(blob);
  const link = document.getElementById("load");
  const fileName = wavFile
    ? wavFile.files[0].name.replace(/.wav/, "")
    : "converted";

  link.setAttribute("href", bUrl);
  link.setAttribute("download", fileName);
  link.style.display = "block";
  link.textContent = `Download ${fileName}.mp3`;
}

convertBtn.addEventListener("click", () => {
  if (!wavFile.files[0]) {
    return false;
  }

  const reader = new FileReader();

  reader.onload = async function(event) {
    const audioData = event.target.result;

    const wav = lamejs.WavHeader.readHeader(new DataView(audioData));

    switch (wav.channels) {
      case 1: {
        const samples = new Int16Array(
          audioData,
          wav.dataOffset,
          wav.dataLen / MONO_LEN_DEVIDER
        );

        encodeMono(wav.channels, wav.sampleRate, samples);
        break;
      }
      case 2: {
        const samples = new Int16Array(
          audioData,
          wav.dataOffset,
          wav.dataLen / STEREO_LEN_DEVIDER
        );
        
        encodeStereo(wav.channels, wav.sampleRate, samples);
        break;
      }
      default:
        alert("Unsupported count of channel");
        break;
    }
  };

  reader.readAsArrayBuffer(wavFile.files[0]);
});
