const inv_base_url = "http://192.168.1.176:3001";

export const getTopEmployee = async () => {
    const options = {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
    };
    const response = await fetch(`${inv_base_url}/getTopEmployee`, options);
    return await response.json();
}