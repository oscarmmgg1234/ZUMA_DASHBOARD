const inv_base_url = "http://72.132.70.167:3001";

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