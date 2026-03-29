import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE_URL = 'http://3.110.147.93:5001';

function buildTargetUrl(request: NextRequest, path: string[]): string {
    const normalizedPath = Array.isArray(path) ? path.join('/') : '';
    const target = new URL(`${BACKEND_BASE_URL}/${normalizedPath}`.replace(/([^:]\/)\/+/g, '$1'));
    target.search = request.nextUrl.search;
    return target.toString();
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    try {
        const { path } = await context.params;
        const targetUrl = buildTargetUrl(request, path || []);
        const method = request.method.toUpperCase();
        const headers = new Headers();

        // Forward essential headers while preventing host/proxy conflicts.
        for (const [key, value] of request.headers.entries()) {
            const lower = key.toLowerCase();
            if (['host', 'connection', 'content-length'].includes(lower)) {
                continue;
            }
            headers.set(key, value);
        }

        const init: RequestInit = {
            method,
            headers,
            cache: 'no-store',
            redirect: 'follow',
        };

        if (!['GET', 'HEAD'].includes(method)) {
            init.body = await request.text();
        }

        const upstream = await fetch(targetUrl, init);
        const responseHeaders = new Headers(upstream.headers);

        // Keep responses dynamic and prevent stale data for judge results.
        responseHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');

        return new NextResponse(await upstream.arrayBuffer(), {
            status: upstream.status,
            headers: responseHeaders,
        });
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                output: '',
                error: error?.message || 'Proxy request failed',
                return_code: -1,
                compilation_error: false,
                runtime_error: true,
                timeout_error: false,
            },
            { status: 502 }
        );
    }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    return proxy(request, context);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    return proxy(request, context);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    return proxy(request, context);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    return proxy(request, context);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    return proxy(request, context);
}

export async function OPTIONS(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    return proxy(request, context);
}

export async function HEAD(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    return proxy(request, context);
}
