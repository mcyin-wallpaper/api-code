export default {


    // 提取重复的token获取逻辑为单独的函数
    async getToken(env) {
        const tokenRequest = new Request('https://coze-token/', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        const tokenResponse = await env.tokenWorker.fetch(tokenRequest);

        if (!tokenResponse.ok) {
            throw new Error(`Token request failed: ${tokenResponse.status} ${tokenResponse.statusText}`);
        }

        const { access_token: token } = await tokenResponse.json();

        if (!token) {
            throw new Error('Response does not contain access_token');
        }

        return token;
    },

    // 提取API请求逻辑为单独的函数
    async fetchApiData(Search_String, env, mode = "壁纸详情页", LIMIT = 1, page = 1) {
        // 准备请求数据
        const requestData = {
            "workflow_id": String(env.WORKFLOW_ID),
            "parameters": {
                "LIMIT": Number(LIMIT),
                "Mode": mode,
                "Page_Integer": Number(page),
                "Search_String": String(Search_String)
            },
            "connector_id": "1024"
        };

        // 从环境变量中获取token
        let token = env.ACCESS_TOKEN;
        // 如果环境变量中没有token，或token为空字符串，则获取新token
        if (!token || token.trim() === '') {
            token = await this.getToken(env);
        }

        // 执行API请求
        const apiRequest = new Request('https://api.coze.cn/v1/workflow/run', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestData)
        });

        // 发送请求并获取响应
        const apiResponse = await fetch(apiRequest);
        if (!apiResponse.ok) {
            throw new Error(`API request failed: ${apiResponse.status} ${apiResponse.statusText}`);
        }
        const apiData = await apiResponse.json();

        // 提取并格式化data字段
        let responseData = apiData;
        if (apiData.data) {
            try {
                responseData = JSON.parse(apiData.data);
            } catch (error) {
                // 如果解析失败，保持原始数据结构
                console.error('Failed to parse data field:', error);
            }
        }

        return responseData;
    },

    // 处理enddate参数的通用函数
    async handleEnddateRequest(request, env, mode) {
        const url = new URL(request.url);
        let enddate = url.searchParams.get('enddate') || '';

        if (request.method === 'POST' && !enddate) {
            const requestClone = request.clone();
            try {
                const body = await requestClone.json();
                enddate = body?.enddate || '';
            } catch (e) {
                const formData = await requestClone.formData();
                enddate = formData?.get('enddate') || '';
            }
        }

        // 验证参数,enddate不能为空,只能是yyyyMMdd格式的日期
        if (!enddate) {
            return new Response(JSON.stringify({ error: 'Missing enddate parameter' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        if (!/^\d{8}$/.test(enddate)) {
            return new Response(JSON.stringify({ error: 'Invalid enddate format. Must be yyyyMMdd' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // 获取API数据
        const apiData = await this.fetchApiData(enddate, env, mode, 1, 1);

        // 返回API响应
        return new Response(JSON.stringify(apiData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    },

    async fetch(request, env) {
        // 处理CORS预检请求
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Max-Age': '86400'
                }
            });
        }

        const url = new URL(request.url);
        const { pathname, origin } = url;

        // 域名访问跳转 - 所有域名访问都跳转到https://wallpaper.mcyin.com/
        /*
        const allowedOrigin = 'https://wallpaper.mcyin.com';
        if (origin !== allowedOrigin) {
            // 301永久重定向到允许的域名，并保留原始请求路径
            const redirectUrl = allowedOrigin + url.pathname + url.search;
            return new Response('', {
                status: 301,
                headers: {
                    'Location': redirectUrl,
                    'Cache-Control': 'public, max-age=31536000, immutable'
                }
            });
        }
        */

        //处理/api/search和/wallpaper/search路径请求
        if (pathname === '/api/search' || pathname === '/wallpaper/search') {
            try {
                // 从请求中获取search，limit，page参数
                let search = url.searchParams.get('search') || '';
                let limitParam = url.searchParams.get('limit') || '';
                let pageParam = url.searchParams.get('page') || '';

                if (request.method === 'POST') {
                    const requestClone = request.clone();
                    try {
                        const body = await requestClone.json();
                        search = search || (body?.search || '');
                        limitParam = limitParam || (body?.limit || '');
                        pageParam = pageParam || (body?.page || '');
                    } catch (e) {
                        const formData = await requestClone.formData();
                        search = search || (formData?.get('search') || '');
                        limitParam = limitParam || (formData?.get('limit') || '');
                        pageParam = pageParam || (formData?.get('page') || '');
                    }
                }

                // 验证参数，limit必须大于等于1且小于等于100之间的正整数，page必须是正整数
                const limit = limitParam ? Number(limitParam) : 1;
                const page = pageParam ? Number(pageParam) : 1;

                if (limitParam) {
                    if (isNaN(limit) || limit < 1 || limit > 100) {
                        return new Response(JSON.stringify({ error: 'Limit must be between 1 and 100' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
                    }
                }
                if (pageParam) {
                    if (isNaN(page) || page < 1) {
                        return new Response(JSON.stringify({ error: 'Page must be a positive integer' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
                    }
                }

                // 获取API数据 - 传入mode参数为"壁纸搜索"，search参数为search，limit参数为limit，page参数为page
                const apiData = await this.fetchApiData(search, env, "壁纸搜索", limit, page);

                // 返回API响应
                const response = new Response(JSON.stringify(apiData), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });

                // 添加CORS头
                response.headers.set('Access-Control-Allow-Origin', '*');
                return response;

            } catch (err) {
                console.error('Search API error:', err);
                const response = new Response(JSON.stringify({ error: 'Internal server error' }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
                response.headers.set('Access-Control-Allow-Origin', '*');
                return response;
            }
        }

        // 处理/api/detail和/wallpaper/detail路径请求
        if (pathname === '/api/detail' || pathname === '/wallpaper/detail') {
            try {
                const response = await this.handleEnddateRequest(request, env, "壁纸详情页");
                response.headers.set('Access-Control-Allow-Origin', '*');
                return response;
            } catch (err) {
                console.error('Detail API error:', err);
                const response = new Response(JSON.stringify({ error: 'Internal server error' }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
                response.headers.set('Access-Control-Allow-Origin', '*');
                return response;
            }
        }

        // 处理/api/view和/wallpaper/view路径请求
        if (pathname === '/api/view' || pathname === '/wallpaper/view') {
            try {
                const response = await this.handleEnddateRequest(request, env, "增加浏览量");
                response.headers.set('Access-Control-Allow-Origin', '*');
                return response;
            } catch (err) {
                console.error('View API error:', err);
                const response = new Response(JSON.stringify({ error: 'Internal server error' }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
                response.headers.set('Access-Control-Allow-Origin', '*');
                return response;
            }
        }

        // 非目标路径请求转发到静态资源
        return fetch(request);
    },
};