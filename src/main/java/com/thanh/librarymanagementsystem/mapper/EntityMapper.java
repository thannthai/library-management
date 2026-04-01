package com.thanh.librarymanagementsystem.mapper;

import org.mapstruct.*;

import java.util.List;

public interface EntityMapper<D, E> {
    E toEntity(D d);

    D toDTO(E e);

    List<E> toEntity(List<D> d);

    List<D> toDTO(List<E> e);

    @Mapping(target = "id", ignore = true)
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntity(D dto, @MappingTarget E entity);
}
