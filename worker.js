import { createClient } from '@supabase/supabase-js';
function initSupabase(env) {
    return createClient(
        env.SUPABASE_URL,
        env.SUPABASE_ANON_KEY
    );
}
async function WallpaperData(env, keyword = "", pageNumber = 1, pageSize = 30, mode = "search") {
    const supabase = initSupabase(env);
    const searchKeyword = `%${keyword}%`;
    if (mode === "views") {
        const { data: viewData, error: viewError } = await supabase
            .from(env.SUPABASE_TABLE_NAME)
            .select('views')
            .eq('enddate', keyword);
        if (viewError) {
            return Response.json({ error: viewError.message }, { status: 400 });
        }
        if (viewData.length === 0) {
            return Response.json({ error: "No data found for the given enddate" }, { status: 404 });
        }
        const views = viewData[0].views;
        const { data, error } = await supabase
            .from(env.SUPABASE_TABLE_NAME)
            .update({ views: Number(views) + 1 })
            .eq('enddate', keyword)
            .select('views');
        if (error) {
            return Response.json({ error: error.message }, { status: 400 });
        }
        return Response.json({ output: data });
    }
    const range = {
        a: (pageNumber - 1) * pageSize,
        b: (pageNumber - 1) * pageSize + pageSize
    };
    let query = supabase
        .from(env.SUPABASE_TABLE_NAME)
        .select('*');
    if (mode === "enddate") {
        query = query.eq('enddate', keyword);
    } else {
        query = query.or(`title.ilike.${searchKeyword},copyright.ilike.${searchKeyword},enddate.ilike.${searchKeyword}`);
    }
    const { data, error } = await query
        .order('enddate', { ascending: false })
        .range(range.a, range.b);
    if (error) {
        return Response.json({ error: error.message }, { status: 400 });
    }
    const Previous_Page = Math.max(pageNumber - 1, 1);
    const Page = pageNumber;
    const Next_Page = data.length <= pageSize ? pageNumber : pageNumber + 1;
    return Response.json({ Previous_Page, Page, Next_Page, output: data.slice(0, pageSize) || [] });
}
export default {
    async fetch(request, env, ctx) {
        const { pathname, searchParams } = new URL(request.url);
        if (pathname === "/wallpaper/search" || pathname === "/api/search") {
            if (request.method === "GET") {
                const keyword = searchParams.get('search') || "";
                const pageNumber = Math.max(Number(searchParams.get('page')) || 1, 1);
                const pageSize = Math.min(Math.max(Number(searchParams.get('limit')) || 30, 1), 100);
                const mode = "search";
                const response = await WallpaperData(env, keyword, pageNumber, pageSize, mode);
                const newResponse = new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: {
                        ...Object.fromEntries(response.headers),
                        'Access-Control-Allow-Origin': '*',
                    },
                });
                return newResponse;
            }
            if (request.method === "POST") {
                const { search, page, limit } = await request.json();
                const keyword = search || "";
                const pageNumber = Math.max(Number(page) || 1, 1);
                const pageSize = Math.min(Math.max(Number(limit) || 30, 1), 100);
                const mode = "search";
                const response = await WallpaperData(env, keyword, pageNumber, pageSize, mode);
                const newResponse = new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: {
                        ...Object.fromEntries(response.headers),
                        'Access-Control-Allow-Origin': '*',
                    },
                });
                return newResponse;
            }
        }
        if (pathname === "/wallpaper/detail" || pathname === "/api/detail") {
            if (request.method === "GET") {
                const keyword = searchParams.get('enddate') || "";
                const mode = "enddate";
                const response = await WallpaperData(env, keyword, 1, 1, mode);
                const newResponse = new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: {
                        ...Object.fromEntries(response.headers),
                        'Access-Control-Allow-Origin': '*',
                    },
                });
                return newResponse;
            }
            if (request.method === "POST") {
                const { enddate } = await request.json();
                const keyword = enddate || "";
                const mode = "enddate";
                const response = await WallpaperData(env, keyword, 1, 1, mode);
                const newResponse = new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: {
                        ...Object.fromEntries(response.headers),
                        'Access-Control-Allow-Origin': '*',
                    },
                });
                return newResponse;
            }
        }
        if (pathname === "/wallpaper/view" || pathname === "/api/view") {
            if (request.method === "GET") {
                const keyword = searchParams.get('enddate') || "";
                const mode = "views";
                const response = await WallpaperData(env, keyword, 1, 1, mode);
                const newResponse = new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: {
                        ...Object.fromEntries(response.headers),
                        'Access-Control-Allow-Origin': '*',
                    },
                });
                return newResponse;
            }
            if (request.method === "POST") {
                const { enddate } = await request.json();
                const keyword = enddate || "";
                const mode = "views";
                const response = await WallpaperData(env, keyword, 1, 1, mode);
                const newResponse = new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: {
                        ...Object.fromEntries(response.headers),
                        'Access-Control-Allow-Origin': '*',
                    },
                });
                return newResponse;
            }
        }
        if (pathname === "/wallpaper/update" || pathname === "/api/update") {
            const supabase = initSupabase(env);
            try {
                const [response1, response2] = await Promise.all([
                    fetch('https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8&mkt=zh-CN'),
                    fetch('https://www.bing.com/HPImageArchive.aspx?format=js&idx=7&n=8&mkt=zh-CN')
                ]);
                const data1 = await response1.json();
                const data2 = await response2.json();
                const allImages = [...data1.images, ...data2.images];
                const uniqueImages = [];
                const seen = new Set();
                for (const img of allImages) {
                    if (!seen.has(img.enddate)) {
                        seen.add(img.enddate);
                        uniqueImages.push(img);
                    }
                }
                const results = { inserted: 0, skipped: 0, errors: [] };
                if (uniqueImages.length === 0) {
                    return Response.json(results, {
                        headers: {
                            'Access-Control-Allow-Origin': '*',
                        },
                    });
                }
                const enddates = uniqueImages.map(img => img.enddate);
                const { data: existingData, error: checkError } = await supabase
                    .from(env.SUPABASE_TABLE_NAME)
                    .select('enddate')
                    .in('enddate', enddates);
                if (checkError) {
                    results.errors.push({ error: checkError.message });
                }
                const existingEnddates = new Set(existingData ? existingData.map(item => item.enddate) : []);
                const newImages = uniqueImages.filter(img => !existingEnddates.has(img.enddate));
                results.skipped = uniqueImages.length - newImages.length;
                if (newImages.length > 0) {
                    const wallpapersToInsert = newImages.map(img => ({
                        enddate: img.enddate,
                        url: "https://cn.bing.com" + img.urlbase + "_UHD.jpg",
                        copyright: img.copyright,
                        title: img.title,
                        views: 0
                    }));
                    const { error: insertError } = await supabase
                        .from(env.SUPABASE_TABLE_NAME)
                        .insert(wallpapersToInsert);
                    if (insertError) {
                        results.errors.push({ error: insertError.message });
                    } else {
                        results.inserted = newImages.length;
                    }
                }
                return Response.json(results, {
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                    },
                });
            } catch (error) {
                return Response.json({ error: error.message }, {
                    status: 500,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                    },
                });
            }
        }
        return Response.json({ error: "API不存在" }, { status: 404 });
    }
}