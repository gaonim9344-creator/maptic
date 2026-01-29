import React, { useRef, useState } from 'react';
import {
    ProTable,
    ModalForm,
    ProFormText,
    ProFormTextArea,
    ProFormDigit,
    ProFormSelect,
    ProFormCheckbox,
    ProFormUploadButton,
    ActionType,
} from '@ant-design/pro-components';
import { Button, message, Popconfirm, Space, Typography } from 'antd';
import type { UploadFile } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Facility, SPORTS_CATEGORIES, FACILITY_FEATURES, FacilityFormData, FacilityImage } from '@/types';
import { facilityService } from '@/services/facilityService';
import './styles.css';

const { Title } = Typography;

const FacilityManager: React.FC = () => {
    const actionRef = useRef<ActionType>();
    const [modalVisible, setModalVisible] = useState(false);
    const [editingFacility, setEditingFacility] = useState<Facility | null>(null);

    // 이미지를 base64로 변환하는 함수
    const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });
    };

    // 시설 등록/수정 핸들러
    const handleSubmit = async (values: any) => {
        try {
            // 이미지 파일 처리
            let processedImages: FacilityImage[] = [];
            if (values.images && values.images.length > 0) {
                processedImages = await Promise.all(
                    values.images.map(async (file: UploadFile) => {
                        // 이미 URL이 있는 경우 (수정 시 기존 이미지)
                        if (file.url) {
                            return {
                                uid: file.uid,
                                name: file.name,
                                url: file.url,
                            };
                        }
                        // 새로 업로드된 파일인 경우
                        if (file.originFileObj) {
                            const base64 = await convertToBase64(file.originFileObj);
                            return {
                                uid: file.uid,
                                name: file.name,
                                url: base64,
                            };
                        }
                        return null;
                    })
                );
                processedImages = processedImages.filter(Boolean) as FacilityImage[];
            }

            const facilityData: FacilityFormData = {
                ...values,
                images: processedImages,
            };

            if (editingFacility) {
                await facilityService.updateFacility(editingFacility.id, facilityData);
                message.success('시설 정보가 수정되었습니다.');
            } else {
                await facilityService.createFacility(facilityData);
                message.success('새 시설이 등록되었습니다.');
            }
            setModalVisible(false);
            setEditingFacility(null);
            actionRef.current?.reload();
            return true;
        } catch (error) {
            message.error('오류가 발생했습니다.');
            return false;
        }
    };

    // 시설 삭제 핸들러
    const handleDelete = async (id: string) => {
        try {
            await facilityService.deleteFacility(id);
            message.success('시설이 삭제되었습니다.');
            actionRef.current?.reload();
        } catch (error) {
            message.error('삭제 중 오류가 발생했습니다.');
        }
    };

    // 수정 모달 열기
    const openEditModal = (facility: Facility) => {
        setEditingFacility(facility);
        setModalVisible(true);
    };

    // 등록 모달 열기
    const openCreateModal = () => {
        setEditingFacility(null);
        setModalVisible(true);
    };

    // 테이블 컬럼 정의
    const columns = [
        {
            title: '시설명',
            dataIndex: 'name',
            key: 'name',
            width: 180,
            ellipsis: true,
        },
        {
            title: '종목',
            dataIndex: 'category',
            key: 'category',
            width: 100,
            filters: true,
            onFilter: true,
            valueEnum: Object.fromEntries(
                SPORTS_CATEGORIES.map((cat) => [cat, { text: cat }])
            ),
        },
        {
            title: '주소',
            dataIndex: 'address',
            key: 'address',
            width: 250,
            ellipsis: true,
            search: false,
        },
        {
            title: '일일권',
            dataIndex: 'price_daily',
            key: 'price_daily',
            width: 100,
            search: false,
            render: (_: unknown, record: Facility) => `${record.price_daily?.toLocaleString() || 0}원`,
        },
        {
            title: '월이용권',
            dataIndex: 'price_monthly',
            key: 'price_monthly',
            width: 120,
            search: false,
            render: (_: unknown, record: Facility) => `${record.price_monthly?.toLocaleString() || 0}원`,
        },
        {
            title: '연이용권',
            dataIndex: 'price_yearly',
            key: 'price_yearly',
            width: 120,
            search: false,
            render: (_: unknown, record: Facility) => `${record.price_yearly?.toLocaleString() || 0}원`,
        },
        {
            title: '편의시설',
            dataIndex: 'features',
            key: 'features',
            width: 150,
            search: false,
            render: (_: unknown, record: Facility) => record.features?.join(', ') || '-',
        },
        {
            title: '관리',
            key: 'action',
            width: 130,
            search: false,
            render: (_: unknown, record: Facility) => (
                <Space size="small">
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => openEditModal(record)}
                    >
                        수정
                    </Button>
                    <Popconfirm
                        title="시설 삭제"
                        description="정말 이 시설을 삭제하시겠습니까?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="삭제"
                        cancelText="취소"
                        okButtonProps={{ danger: true }}
                    >
                        <Button type="link" danger icon={<DeleteOutlined />}>
                            삭제
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="facility-manager">
            <div className="page-header">
                <Title level={2}>시설 관리</Title>
                <p className="page-description">
                    스포츠 시설 정보를 등록하고 관리하세요.
                </p>
            </div>

            <ProTable<Facility>
                actionRef={actionRef}
                columns={columns}
                rowKey="id"
                request={async () => {
                    const data = await facilityService.getFacilities();
                    return {
                        data,
                        success: true,
                        total: data.length,
                    };
                }}
                search={{
                    labelWidth: 'auto',
                    collapsed: false,
                }}
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                }}
                dateFormatter="string"
                headerTitle="등록된 시설 목록"
                toolBarRender={() => [
                    <Button
                        key="create"
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={openCreateModal}
                    >
                        시설 등록
                    </Button>,
                ]}
                cardBordered
            />

            {/* 등록/수정 모달 */}
            <ModalForm<FacilityFormData>
                title={editingFacility ? '시설 정보 수정' : '새 시설 등록'}
                open={modalVisible}
                onOpenChange={(visible) => {
                    setModalVisible(visible);
                    if (!visible) setEditingFacility(null);
                }}
                onFinish={handleSubmit}
                initialValues={
                    editingFacility
                        ? {
                            name: editingFacility.name,
                            address: editingFacility.address,
                            category: editingFacility.category,
                            price_daily: editingFacility.price_daily,
                            price_monthly: editingFacility.price_monthly,
                            price_yearly: editingFacility.price_yearly,
                            description: editingFacility.description,
                            features: editingFacility.features,
                            images: editingFacility.images?.map((img) => ({
                                uid: img.uid,
                                name: img.name,
                                url: img.url,
                                status: 'done' as const,
                            })),
                        }
                        : {
                            features: [],
                            images: [],
                        }
                }
                modalProps={{
                    destroyOnClose: true,
                    width: 600,
                }}
                submitter={{
                    searchConfig: {
                        submitText: editingFacility ? '수정하기' : '등록하기',
                        resetText: '취소',
                    },
                }}
            >
                <ProFormText
                    name="name"
                    label="시설명"
                    placeholder="시설 이름을 입력하세요"
                    rules={[{ required: true, message: '시설명을 입력해주세요' }]}
                />

                <ProFormText
                    name="address"
                    label="주소"
                    placeholder="시설 주소를 입력하세요 (나중에 지도 API와 연동 예정)"
                    rules={[{ required: true, message: '주소를 입력해주세요' }]}
                    extra="* 추후 지도 검색 기능이 추가될 예정입니다."
                />

                <ProFormSelect
                    name="category"
                    label="종목"
                    placeholder="스포츠 종목을 선택하세요"
                    rules={[{ required: true, message: '종목을 선택해주세요' }]}
                    options={SPORTS_CATEGORIES.map((cat) => ({
                        label: cat,
                        value: cat,
                    }))}
                    showSearch
                    fieldProps={{
                        optionFilterProp: 'label',
                    }}
                />

                <ProFormDigit
                    name="price_daily"
                    label="일일권 가격"
                    placeholder="일일 이용 요금"
                    rules={[{ required: true, message: '일일권 가격을 입력해주세요' }]}
                    min={0}
                    fieldProps={{
                        formatter: (value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ','),
                        parser: (value) => Number(value?.replace(/,/g, '') || 0),
                        addonAfter: '원',
                    }}
                />

                <ProFormDigit
                    name="price_monthly"
                    label="월 이용권 가격"
                    placeholder="월간 이용 요금"
                    rules={[{ required: true, message: '월 이용권 가격을 입력해주세요' }]}
                    min={0}
                    fieldProps={{
                        formatter: (value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ','),
                        parser: (value) => Number(value?.replace(/,/g, '') || 0),
                        addonAfter: '원',
                    }}
                />

                <ProFormDigit
                    name="price_yearly"
                    label="연 이용권 가격"
                    placeholder="연간 이용 요금"
                    rules={[{ required: true, message: '연 이용권 가격을 입력해주세요' }]}
                    min={0}
                    fieldProps={{
                        formatter: (value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ','),
                        parser: (value) => Number(value?.replace(/,/g, '') || 0),
                        addonAfter: '원',
                    }}
                />

                <ProFormTextArea
                    name="description"
                    label="시설 설명"
                    placeholder="시설에 대한 상세 설명을 입력하세요"
                    rules={[{ required: true, message: '시설 설명을 입력해주세요' }]}
                    fieldProps={{
                        rows: 4,
                        showCount: true,
                        maxLength: 500,
                    }}
                />

                <ProFormCheckbox.Group
                    name="features"
                    label="편의시설"
                    options={[...FACILITY_FEATURES]}
                />

                <ProFormUploadButton
                    name="images"
                    label="시설 사진"
                    title="사진 업로드"
                    max={5}
                    fieldProps={{
                        listType: 'picture-card',
                        beforeUpload: () => false, // 자동 업로드 방지
                        accept: 'image/*',
                    }}
                    icon={<PlusOutlined />}
                    extra="시설 내부, 샤워실, 가격표 사진을 올려주세요 (최대 5장)"
                />
            </ModalForm>
        </div>
    );
};

export default FacilityManager;
