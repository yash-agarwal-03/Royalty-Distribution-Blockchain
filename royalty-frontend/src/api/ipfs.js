// src/api/ipfs.js

// Access environment variables in Vite using import.meta.env
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;

if (!PINATA_JWT) {
    console.warn("⚠️ Pinata JWT is missing. File uploads will fail.");
}

const uploadFileToIPFS = async (file) => {
    if (!file) return null;

    const formData = new FormData();
    formData.append('file', file);

    // Optional: Add Metadata for Pinata Dashboard organization
    const metadata = JSON.stringify({
        name: file.name,
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
        cidVersion: 0,
    });
    formData.append('pinataOptions', options);

    try {
        const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${PINATA_JWT}`,
            },
            body: formData,
        });
        
        if (!res.ok) throw new Error(`Pinata Upload Error: ${res.statusText}`);
        
        const resData = await res.json();
        return resData.IpfsHash; // The CID
    } catch (error) {
        console.error("IPFS File Upload Failed:", error);
        throw error;
    }
};

const uploadMetadataToIPFS = async (metadataJSON) => {
    try {
        const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${PINATA_JWT}`,
            },
            body: JSON.stringify(metadataJSON),
        });

        if (!res.ok) throw new Error(`Pinata Metadata Error: ${res.statusText}`);

        const resData = await res.json();
        return resData.IpfsHash;
    } catch (error) {
        console.error("IPFS Metadata Upload Failed:", error);
        throw error;
    }
};

export { uploadFileToIPFS, uploadMetadataToIPFS };